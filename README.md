remailer
========

Do smart things with my email


# Getting started

```bash
npm install

# setup your .env file with IMAP_USER, IMAP_PASS, IMAP_RULES, and IMAP_UID
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
