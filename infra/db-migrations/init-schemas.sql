-- Initialize schemas for all microservices
-- This script creates separate schemas for each service

-- Auth Service Schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Lead Service Schema
CREATE SCHEMA IF NOT EXISTS lead;

-- Content Service Schema
CREATE SCHEMA IF NOT EXISTS content;

-- Subscriber Service Schema
CREATE SCHEMA IF NOT EXISTS subscriber;

-- Coupon Service Schema
CREATE SCHEMA IF NOT EXISTS coupon;

-- Plan Service Schema
CREATE SCHEMA IF NOT EXISTS plan;

-- Subscription Service Schema
CREATE SCHEMA IF NOT EXISTS subscription;

-- Billing Service Schema
CREATE SCHEMA IF NOT EXISTS billing;

-- Payment Service Schema
CREATE SCHEMA IF NOT EXISTS payment;

-- Ticket Service Schema
CREATE SCHEMA IF NOT EXISTS ticket;

-- Assignment Service Schema
CREATE SCHEMA IF NOT EXISTS assignment;

-- Media Service Schema
CREATE SCHEMA IF NOT EXISTS media;

-- Notification Service Schema
CREATE SCHEMA IF NOT EXISTS notification;

-- Reporting Service Schema
CREATE SCHEMA IF NOT EXISTS reporting;

-- Audit Service Schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON SCHEMA auth TO ashva;
-- GRANT ALL PRIVILEGES ON SCHEMA lead TO ashva;
-- ... (repeat for all schemas)
