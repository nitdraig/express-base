# Express TypeScript Starter Project

This repository provides a solid foundation for building backend applications with **Express.js** and **TypeScript**, following modern architecture and development best practices. The project is designed to be modular, secure, and scalable, including common tools and patterns that facilitate development.

---

## **Table of Contents**

- [Project Structure](#project-structure)
- [Installation and Configuration](#installation-and-configuration)
- [Available Scripts](#available-scripts)
- [Main Dependencies](#main-dependencies)
- [Project Features](#project-features)
- [Usage Guide](#usage-guide)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Health & Business Pulse (design doc, Spanish)](docs/health-business-pulse.md)

---

## **Project Structure**

The architecture is organized into clear folders to separate business logic, shared resources, and global configuration:

```
my-express-base/
├── src/
│   ├── domain/            # Business logic split by feature
│   │   ├── [FeatureName]/
│   │   │   ├── controllers/   # Route controllers
│   │   │   ├── services/      # Business services
│   │   │   ├── routes/        # Route definitions
│   │   │   ├── models/        # Data models
│   ├── shared/            # Reusable resources
│   │   ├── middlewares/   # Global middlewares
│   │   ├── utils/         # Common utilities
│   ├── app.ts             # Main Express configuration
│   ├── server.ts          # Server entry point
├── .env                   # Environment variables
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── README.md              # Project documentation
```

---

## **Installation and Configuration**

### **1. Prerequisites**

- Node.js (>= 18.x)
- pnpm (>= 8.x)

### **2. Clone the repository**

```bash
git clone https://github.com/nitdraig/express-base.git
cd express-base
```

### **3. Install dependencies**

```bash
pnpm install or npm install
```

### **4. Configure environment variables**

Rename `.env.example` to `.env` and update the variables as needed:

```env
PORT=3000
DB_URI=mongodb://localhost:27017/mydatabase
JWT_SECRET=supersecretkey
```

### **5. Start the server**

```bash
pnpm run dev or npm run dev
```

The server will be available at `http://localhost:5000`.

---

## **Available Scripts**

### **Development**

- `pnpm run dev or npm run dev`: Starts the server in development mode with automatic reload.

### **Production**

- `pnpm build`: Compiles the TypeScript project to JavaScript in the `dist/` folder.
- `pnpm start`: Starts the server with the compiled code.

### **Testing**

- `pnpm test`: Runs unit tests with Jest.

---

## **Main Dependencies**

### **Production**:

- **express**: Minimalist web framework.
- **cors**: Enables CORS requests.
- **helmet**: Improves application security.
- **dotenv**: Environment variable handling.
- **mongoose**: ODM for MongoDB.
- **jsonwebtoken**: JWT token generation and validation.

### **Development**:

- **typescript**: TypeScript support.
- **tsx**: Ejecución de TypeScript y recarga automática en desarrollo.
- **jest**: Unit testing framework.
- **@types/...**: Type definitions for libraries.

---

## **Project Features**

### **1. Security**

- **Helmet**: Configured for secure HTTP headers.
- **CORS**: Allows requests from trusted origins.
- **JWT Protection**: Middleware for authentication.

### **2. Validation**

- **Joi**: Input data validation.

### **3. Error Handling**

- Global middleware to catch and format errors.

### **4. Modular Architecture**

- Clear separation of concerns by folders and domains.

### **5. Database Connection**

- Ready-to-use configuration for MongoDB with Mongoose.

### **6. Swagger Documentation**

- Endpoints documented with Swagger.

---

## **Usage Guide**

### **1. Adding a new feature**

To add new functionality, create a directory under `src/domain/[FeatureName]` with the required subfolders:

```
src/domain/MyFeature/
├── controllers/
├── routes/
├── services/
├── models/
```

---

## **Roadmap**

Some ideas for future improvements:

- [ ] Integrate **Prisma** as an alternative to Mongoose.
- [ ] Add WebSockets support.
- [ ] Configure Docker for deployment.
- [ ] Implement a service layer for role-based authorization.
- [ ] Set up a caching system with Redis.

---

## **Contributing**

If you would like to contribute, please:

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. Make your changes and commit:
   ```bash
   git commit -m 'Add new feature X'
   ```
4. Submit a pull request.

---

# Generate a JWT Secret Key

To generate a random JWT secret key, you can use a tool like Node.js to create a random string. Here's a simple example:

- Open your terminal or command prompt.
- Run the following Node.js script to generate a random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

```

- This command uses the crypto module in Node.js to generate a random sequence of 32 bytes and then converts it to a hexadecimal string.
- Copy the generated string.
- Open your .env file and set the JWT secret key:
- JWT_SECRET=paste-the-generated-string-here
- Replace paste-the-generated-string-here with the string you copied.
- Save the changes to your .env file.

Now, you have a securely generated JWT secret key. Remember to keep this key confidential and don't share it publicly. If needed, you can regenerate the key and update it in your .env file.

---

Thank you for using this starter project! If you have questions or suggestions, feel free to open an issue.
