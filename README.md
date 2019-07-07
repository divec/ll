# LL — two-way parallel translation

![LL logo](https://raw.githubusercontent.com/divec/ll/master/demo/ll-logo.png)

## Getting started

- Clone the repository
- Get the ve submodule
- `git submodule update --init lib/ve`
- Initialise and build the repository
- `npm install`
- `grunt`
- Initialise and build the VE sub-module
- `cd lib/ve`
- `npm install`
- `grunt build`
- Download, install and run [Apertium-APy](https://github.com/apertium/apertium-apy) .
 (or alternatively, edit `demo/demo.ll.js` and change `http://localhost:2737/translate` to point to a public Apertium-APy instance)
- Run a local static webserver in the repository directory: `python3 -m http.server`
- Browse to `http://localhost:8000/demo/LL.html`

## License

Copyright (C) 2019, [LL team](AUTHORS.txt) and others.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU Affero General Public License](LICENSE.txt) for more details.
