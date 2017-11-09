'use strict';

var user = require('../models/index').user;
var jwt = require('jsonwebtoken');
const key = require('../config/index').key;