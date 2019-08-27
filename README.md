# LL — two-way parallel translation

![LL logo](https://raw.githubusercontent.com/divec/ll/master/demo/images/logo.png)

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
- `cp environment.json.apertium-example environment.json`
 (or alternatively, use `environment.json.yandex-example` and put in your Yandex API key)
- Run any local webserver in the repository directory, e.g. `python3 -m http.server`
- Browse to one of the html pages in `/demo`, e.g. `http://localhost:8000/demo/LL-apex.html` or `http://localhost:8000/demo/LL-wmui.html`

## License

Copyright (C) 2019, [LL team](AUTHORS.txt) and others.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU Affero General Public License](LICENSE.txt) for more details.
