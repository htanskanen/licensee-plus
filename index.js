module.exports = licenseePlus;

var https = require("https");
var licensee = require("licensee");
var mapLimit = require("map-limit");
var licenseSatisfies = require("spdx-satisfies");
var validSPDX = require("spdx-expression-validate");

// Config for requests
var MAX_REQUEST = 50; // max no of dependencies per request
var REQUEST_OPTIONS = {
  host: "api.clearlydefined.io",
  path: "/definitions",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    accept: "application/json"
  }
};

function licenseePlus(config, path, callback) {
  licensee(config, path, function(error, dependencies) {
    if (error) {
      callback(error);
    } else {
      checkAgainstClearlyApi(dependencies, config, function(error, results) {
        if (error) {
          callback(error);
        } else {
          callback(null, results);
        }
      });
    }
  });
}

// Sorry for the bad readability, it's partly due to my autoformatting :/

function checkAgainstClearlyApi(dependencies, config, callback) {
  dependencies.forEach(function(d) {
    d.coordinate = "npm/npmjs/-/" + d.name + "/" + d.version;
  });
  var coords = dependencies.map(function(d) {
    return d.coordinate;
  });
  var chunks = []; // Splitting targets into arrays to avoid a huge single request
  while (coords.length > 0)
    chunks.push(JSON.stringify(coords.splice(0, MAX_REQUEST)));
  mapLimit(chunks, 2, makeRequest, function(error, results) {
    if (error) {
      callback(error);
    } else {
      results = results.reduce(function(acc, curr) {
        return Object.assign(acc, curr);
      }, {});
      dependencies.forEach(function(d) {
        rootDir = RegExp("^package/");
        if (
          results.hasOwnProperty(d.coordinate) &&
          results[d.coordinate].hasOwnProperty("files")
        ) {
          d.apiResult = true;
          var matches = results[d.coordinate].files.reduce(function(
            all,
            current
          ) {
            if (
              current.hasOwnProperty("license") &&
              rootDir.test(current.path)
            ) {
              current.path = current.path.replace(rootDir, "/");
              all.hasOwnProperty(current.license)
                ? all[current.license].push(current.path)
                : (all[current.license] = [current.path]);
            }
            return all;
          },
          {});
          if (Object.keys(matches).length > 0) {
            d.licenseMatches = matches;
            var badMatches = Object.keys(matches).reduce(function(bad, key) {
              if (
                d.hasOwnProperty("license") &&
                d.license &&
                isBad(key, d.license, config)
              ) {
                bad.push({ match: key, files: matches[key] });
              }
              return bad;
            }, []);
            if (badMatches.length > 0 && !d.whitelisted) {
              d.badLicenseMatches = badMatches;
              d.approved = false;
            }
          }
        } else {
          d.apiResult = false;
          if (
            config.hasOwnProperty("requireClearlyDefined") &&
            config.requireClearlyDefined === true
          ) {
            d.approved = false;
          }
        }
      });
      callback(null, dependencies);
    }
  });
}

function makeRequest(requestData, callback) {
  var data = [];
  var request = https.request(REQUEST_OPTIONS, function(response) {
    response.setEncoding("utf8");
    response.on("data", function(chunk) {
      data.push(chunk);
    });
    response.on("end", function() {
      callback(null, JSON.parse(data.join("")));
    });
  });
  request.on("error", function(error) {
    callback(error);
  });
  request.write(requestData);
  request.end();
}

function isBad(match, packageLicense, config) {
  if (
    config.hasOwnProperty("requirePackageLicenseMatch") &&
    config.requirePackageLicenseMatch === true
  ) {
    var cleanMatch = match.replace(/^\(|\)$/g, "");
    if (cleanMatch.toUpperCase() !== packageLicense.toUpperCase()) {
      return true;
    }
  }
  var licenseExpression = config.license;
  var matchesRule =
    licenseExpression &&
    validSPDX(licenseExpression) &&
    match &&
    typeof match === "string" &&
    validSPDX(match) &&
    licenseSatisfies(match, licenseExpression);
  if (!matchesRule) {
    return true;
  }
  return false;
}
