Check npm package dependency license metadata and package data from ClearlyDefined against rules. This is based on and extends the functionality of [licensee.js][licensee]. Experimental, not stable.

[licensee]: https://github.com/jslicense/licensee.js/

# Configuration

Accepts the following configuration:

1. a rule about permitted licenses
2. a package whitelist of name-and-range pairs
3. options for comparing package license metadata to file-based information from ClearlyDefined

You can set configuration with command flags or a `.licensee.json` file at the root of your package, like so:

```json
{
  "license": "(MIT OR BSD-2-Clause OR BSD-3-Clause OR Apache-2.0)",
  "whitelist": {
    "optimist": "<=0.6.1"
  },
  "corrections": false,
  "ignore": [
    { "scope": "kemitchell" },
    { "prefix": "commonform-" },
    { "author": "Kyle E. Mitchell" }
  ],
  "requirePackageLicenseMatch": true,
  "requireClearlyDefined": true
}
```

The `license` property is an SPDX license expression that [spdx-expression-parse][parse] can parse. Any package with [standard license metadata][metadata] _or_ file-level license data from the relevant [ClearlyDefined definition][definition] that does not satisfy the SPDX license expression according to [spdx-satisfies][satisfies] will cause an error.

[parse]: https://www.npmjs.com/package/spdx-expression-parse
[satisfies]: https://www.npmjs.com/package/spdx-satisfies
[definition]: https://clearlydefined.io/definitions

The `whitelist` is a map from package name to a [node-semver][semver] Semantic Versioning range. Packages whose license data don't match the SPDX license expression in `license` but have a name and version described in `whitelist` will not cause an error.

[metadata]: https://docs.npmjs.com/files/package.json#license
[semver]: https://www.npmjs.com/package/semver

The `corrections` flag toggles community corrections to npm package
license metadata. When enabled, `licensee` will check `license` and
`whitelist` against `license` values from [npm-license-corrections]
when available.

[npm-license-corrections]: https://www.npmjs.com/package/npm-license-corrections

The optional `ignore` array instructs `licensee` to approve packages
without considering their `license` metadata. Ignore rules can take
one of three forms:

1.  `{"scope":"x"}` ignores all packages in scope `x`, like `@x/y`.

2.  `{"prefix":"x"}` ignores all packages whose names start with `x`,
    but not scoped packages whose scopes do not match, like `@y/x`.

3.  `{"author":"x"}` ignores all packages whose authors' names,
    e-mail addresses, or URLs contain `x`.

All ignore rules are case-insensitive.

Where the optional property `requirePackageLicenseMatch` is `true`, any file-level license hit from ClearlyDefined that does not match the package standard license metadata will cause an error. False by default.

Where the optional property `requireClearlyDefined` is `true`, dependencies for which no file-level data is available from ClearlyDefined will cause an error. False by default.

# Use

To install and use `licensee-plus` globally (it has not been published):

```bash
npm install --global henritns/licensee-plus
cd your-package
licensee-plus --init
licensee-plus
```

The `licensee-plus` script prints a report about dependencies and their license terms to standard output. It exits with status `0` when all packages in `./node_modules` meet the configured licensing criteria and `1` when one or more do not.

To install it as a development dependency of your package:

```bash
cd your-package
npm install --save-dev henritns/licensee-plus
```

Consider adding `licensee-plus` to your npm scripts:

```json
{
  "scripts": {
    "posttest": "licensee-plus"
  }
}
```

For output as newline-delimited JSON objects, for further processing:

```json
{
  "scripts": {
    "posttest": "licensee-plus --ndjson"
  }
}
```

To skip the readout of license information:

```json
{
  "scripts": {
    "posttest": "licensee-plus --quiet"
  }
}
```

If you want a readout of dependency information, but don't want your continuous integration going red, you can ignore `licensee-plus`'s exit code:

```json
{
  "scripts": {
    "posttest": "licensee-plus || true"
  }
}
```

To save the readout of license information to a file:

```json
{
  "scripts": {
    "posttest": "licensee-plus | tee LICENSES || true"
  }
}
```

Alternatively, for a readout of just packages without approved licenses:

```json
{
  "scripts": {
    "posttest": "licensee-plus --errors-only"
  }
}
```

# JavaScript Module

The package exports an asynchronous function of three arguments:

1. A configuration object in the same form as `.licensee.json`.

2. The path of the package to check.

3. An error-first callback that yields an array of objects, one per
   dependency.

# Licensing

This package is based on and incorporates original code from [licensee.js][licensee-version] by [Kyle Mitchell][kemitchell]. All code in this package, old and new, is licensed under the `Apache-2.0` license.

[licensee-version]: https://github.com/jslicense/licensee.js/tree/8c6b68f2fd82d3cbcdfed8714475900091ba4d02
[kemitchell]: https://github.com/kemitchell
