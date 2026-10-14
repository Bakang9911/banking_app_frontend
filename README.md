# Banking Application — Frontend

React + TypeScript frontend for the Banking Application portfolio project. Built with Vite, React Router, and Axios, and intended to work with the Java Spring Boot backend.

**Portfolio status: Project 1 core milestone complete.** Remaining API integration and production-readiness tasks are documented as follow-up work; not every screen or service is claimed to be fully integrated with the current backend.

## Technology stack

- React and TypeScript
- Vite
- React Router
- Axios for backend API calls

## Current frontend structure

- Login page and protected routes
- Customer dashboard
- Admin dashboard structure
- API client and service modules for accounts, transactions, beneficiaries, authentication, and deposit requests

## Backend repository

https://github.com/Bakang9911/banking_app

## Follow-up integration work

- Align the login request/response with the backend authentication implementation
- Verify every service endpoint against a working backend endpoint
- End-to-end test account, transaction, beneficiary, and deposit-request flows
- Add UI validation, error/loading states, and automated tests
- Configure environment-specific API URLs rather than relying on a localhost URL for deployment

## Future feature: Investment tools

Investment functionality is planned for a future version and is not currently implemented. A possible enhancement is an educational investment section with simple return calculations and charts.

## Run locally

Install Node.js, then run:

```bash
npm install
npm run dev
```

Use the backend repository instructions to configure and start the API. This is an educational portfolio project, not a production banking service.
