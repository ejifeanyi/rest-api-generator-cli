# REST API Generator CLI

A command-line tool to quickly generate REST API boilerplates with optional authentication and database setup.

## Features

- Generate complete REST API structure
- Optional authentication setup
- MongoDB/PostgreSQL database integration
- Best practices folder structure
- Basic CRUD operations
- Environment configuration
- Error handling middleware

## Installation

```bash
npm install -g rest-api-generator-cli
```

## Usage

```bash
rest-api-generator --name my-api --auth --database mongodb
```

#### Or

```bash
npx rest-api-generator-cli --name my-api --auth --database mongodb
```

### Options

- `-n, --name <name>` - Project name (required)
- `-a, --auth` - Include authentication (optional)
- `-d, --database <type>` - Database type (mongodb/postgres) (default: mongodb)

## Project Structure

```
my-api/
├── src/
│   ├── models/
│   │   └── user.js
│   ├── controllers/
│   │   └── userController.js
│   ├── routes/
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   └── index.js
├── .env
└── package.json
```

## Development

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/rest-api-generator-cli.git
```

2. Install dependencies:

```bash
cd rest-api-generator-cli
npm install
```

3. Link package locally:

```bash
npm link
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
