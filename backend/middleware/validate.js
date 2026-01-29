const { body, param } = require("express-validator");

exports.validateTournamentCreate = [
  body("title").trim().isLength({ min: 3 }),
  body("entryFee").isNumeric(),
  body("maxSlots").isInt({ min: 1 }),
];

exports.validateObjectId = [
  param("id").isMongoId()
];
