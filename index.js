#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const chalk = require("chalk");

program
	.version("1.0.0")
	.description("Generate a REST API boilerplate")
	.option("-n, --name <name>", "Project name")
	.option("-a, --auth", "Include authentication")
	.option(
		"-d, --database <type>",
		"Database type (mongodb/postgres)",
		"mongodb"
	)
	.parse(process.argv);

const options = program.opts();

// Template for package.json
const packageTemplate = (name) => `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "REST API generated with rest-api-generator",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.17.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "helmet": "^5.0.2",
    "morgan": "^1.10.0",
    "mongoose": "^6.2.4",
    "joi": "^17.6.0"${
			options.auth
				? ',\n    "jsonwebtoken": "^8.5.1",\n    "bcryptjs": "^2.4.3"'
				: ""
		}
  },
  "devDependencies": {
    "nodemon": "^2.0.15",
    "jest": "^27.5.1"
  }
}`;

// Template for .env
const envTemplate = `NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost/${options.name}
${options.auth ? "JWT_SECRET=your_jwt_secret\nJWT_EXPIRES_IN=90d" : ""}`;

// Template for main server file
const serverTemplate = `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/v1/users', require('./routes/users'));
${options.auth ? "app.use('/api/v1/auth', require('./routes/auth'));" : ""}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;

// Template for user model
const userModelTemplate = `const mongoose = require('mongoose');
${options.auth ? "const bcrypt = require('bcryptjs');" : ""}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
  }${
		options.auth
			? `,
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  }`
			: ""
	}
}, {
  timestamps: true
});

${
	options.auth
		? `
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};`
		: ""
}

module.exports = mongoose.model('User', userSchema);`;

// Template for user controller
const userControllerTemplate = `const User = require('../models/user');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: 'success',
      data: { users }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};`;

// Template for user routes
const userRoutesTemplate = `const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
${options.auth ? "const authMiddleware = require('../middleware/auth');" : ""}

router
  .route('/')
  .get(${options.auth ? "authMiddleware, " : ""}userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(${options.auth ? "authMiddleware, " : ""}userController.getUser);

module.exports = router;`;

// Create project structure
const createProjectStructure = (name) => {
	const baseDir = path.join(process.cwd(), name);

	// Create main project directory
	fs.mkdirSync(baseDir);
	fs.mkdirSync(path.join(baseDir, "src"));
	fs.mkdirSync(path.join(baseDir, "src/models"));
	fs.mkdirSync(path.join(baseDir, "src/controllers"));
	fs.mkdirSync(path.join(baseDir, "src/routes"));
	fs.mkdirSync(path.join(baseDir, "src/middleware"));
	fs.mkdirSync(path.join(baseDir, "src/utils"));

	// Create files
	fs.writeFileSync(path.join(baseDir, "package.json"), packageTemplate(name));
	fs.writeFileSync(path.join(baseDir, ".env"), envTemplate);
	fs.writeFileSync(path.join(baseDir, "src/index.js"), serverTemplate);
	fs.writeFileSync(path.join(baseDir, "src/models/user.js"), userModelTemplate);
	fs.writeFileSync(
		path.join(baseDir, "src/controllers/userController.js"),
		userControllerTemplate
	);
	fs.writeFileSync(
		path.join(baseDir, "src/routes/users.js"),
		userRoutesTemplate
	);

	if (options.auth) {
		fs.writeFileSync(
			path.join(baseDir, "src/middleware/auth.js"),
			`const jwt = require('jsonwebtoken');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};`
		);
	}
};

// Main execution
if (!options.name) {
	console.error(chalk.red("Error: Project name is required"));
	process.exit(1);
}

try {
	createProjectStructure(options.name);
	console.log(
		chalk.green(`\n✨ Project ${options.name} created successfully!`)
	);
	console.log(chalk.blue("\nNext steps:"));
	console.log(chalk.white(`1. cd ${options.name}`));
	console.log(chalk.white("2. npm install"));
	console.log(chalk.white("3. Update .env file with your configuration"));
	console.log(chalk.white("4. npm run dev"));
} catch (err) {
	console.error(chalk.red("Error creating project:"), err);
	process.exit(1);
}
