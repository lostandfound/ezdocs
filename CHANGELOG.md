# Changelog

All notable changes to the EzDocs project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-03-03

### Added
- Initial project setup for EzDocs
- Backend application with Express.js and TypeScript
- Google Cloud Platform integration
  - Cloud Run deployment
  - Artifact Registry configuration
  - Cloud Build CI/CD pipeline
- Setup scripts for environment configuration
  - Basic setup for general users (setup.js)
  - Developer setup for CI/CD (setup-dev.js)
  - Common module for shared functionality (setup-common.js)
- Documentation
  - README with detailed setup instructions
  - Developer documentation (docs/dev.md)
  - Task tracking in docs/tasks

### Changed
- Split setup scripts into modular components
  - Common functionality extracted to setup-common.js
  - Created dedicated developer setup in setup-dev.js
  - Simplified basic setup.js for general users
- Improved Cloud Build service account permissions
  - Added support for projects with conditional IAM policies
  - Enhanced error handling for permission settings

### Fixed
- Cloud Build deployment issues
  - Added `--condition=None` parameter for IAM policy bindings
  - Fixed logging permissions for the Cloud Build service account

### Security
- Implemented secure handling of API keys and credentials
- Set up proper IAM permissions with least privilege principle 

## [0.0.2] - 2025-03-04

### Added
- REST API implementation for document resource
  - CRUD endpoints with validation
  - Request sanitization for security
  - Error handling middleware
  - Pagination support
- OpenAPI specification (v2.0) for Google API Gateway
- Database schema and migrations
  - Document model implementation
  - SQLite database configuration
- Comprehensive test suite
  - Unit tests for middleware and services
  - Integration tests for API endpoints
  - Test helpers and fixtures
  - Test database management
- Documentation
  - API documentation in OpenAPI format
  - Test plan and implementation report
  - Database schema documentation

### Security
- Input validation using Zod schemas
- XSS prevention with sanitization middleware
- Request size limits (30MB)
- Secure error handling 