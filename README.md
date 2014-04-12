stdinbox
========
[![Build Status](https://drone.io/github.com/smurthas/stdinbox/status.png)](https://drone.io/github.com/smurthas/stdinbox/latest)

Do smart things with my email


# Getting started

```bash
npm install
```

set up your .env file with

```
IMAP_USER=someone@gmail.com
IMAP_PASS=yourpassword
IMAP_RULES=/path/to/a/rules/file.js
```

then run it:

```
foreman start
```

Currently, only works with Gmail.


# Rules

A path or url to a rules file is required in `IMAP_RULES`.

## Example Rules

```javascript
module.exports = [
];
```
