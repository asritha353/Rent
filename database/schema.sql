-- ============================================================
-- RentLux Database Schema — Microsoft SQL Server
-- Run this manually if you prefer not to use auto-init in db.js
-- ============================================================

-- Create database (run once as sysadmin)
-- CREATE DATABASE RentLux;
-- GO
-- USE RentLux;
-- GO

-- ── Users (Tenant / Owner / Admin)
CREATE TABLE Users (
  id            VARCHAR(50)   PRIMARY KEY,
  name          NVARCHAR(100) NOT NULL,
  email         NVARCHAR(100) NOT NULL,
  password_hash NVARCHAR(255) NOT NULL,
  role          NVARCHAR(20)  NOT NULL DEFAULT 'tenant',  -- tenant | owner | admin
  phone         NVARCHAR(20),
  created_at    DATETIME2     DEFAULT GETDATE(),
  CONSTRAINT UQ_Users_Email UNIQUE (email)
);

-- ── Owner-posted Property Listings
CREATE TABLE Properties (
  id          VARCHAR(50)   PRIMARY KEY,
  owner_id    VARCHAR(50)   NOT NULL,
  title       NVARCHAR(200) NOT NULL,
  city        NVARCHAR(100) NOT NULL,
  location    NVARCHAR(200),
  price       DECIMAL(18,2) NOT NULL,
  bhk         INT,
  type        NVARCHAR(50)  DEFAULT 'Apartment',
  description NVARCHAR(MAX),
  images      NVARCHAR(MAX),                     -- JSON array of image URLs
  status      NVARCHAR(20)  DEFAULT 'available', -- available | rented
  created_at  DATETIME2     DEFAULT GETDATE(),
  CONSTRAINT FK_Properties_Owner FOREIGN KEY (owner_id) REFERENCES Users(id)
);

-- ── Tenant Rental Applications
CREATE TABLE Applications (
  id          VARCHAR(50)  PRIMARY KEY,
  tenant_id   VARCHAR(50)  NOT NULL,
  property_id VARCHAR(50)  NOT NULL,
  message     NVARCHAR(MAX),
  status      NVARCHAR(20) DEFAULT 'pending',  -- pending | accepted | rejected | withdrawn
  applied_at  DATETIME2    DEFAULT GETDATE(),
  resolved_at DATETIME2,
  CONSTRAINT FK_Applications_Tenant   FOREIGN KEY (tenant_id)   REFERENCES Users(id),
  CONSTRAINT FK_Applications_Property FOREIGN KEY (property_id) REFERENCES Properties(id)
);

-- ── Rental Agreements (created after application accepted)
CREATE TABLE Agreements (
  id             VARCHAR(50)   PRIMARY KEY,
  application_id VARCHAR(50)   NOT NULL,
  terms          NVARCHAR(MAX) NOT NULL,
  generated_at   DATETIME2     DEFAULT GETDATE(),
  signed_tenant  BIT           DEFAULT 0,
  signed_owner   BIT           DEFAULT 0,
  CONSTRAINT FK_Agreements_Application FOREIGN KEY (application_id) REFERENCES Applications(id)
);

-- ── Useful indexes
CREATE INDEX IX_Properties_Owner  ON Properties  (owner_id);
CREATE INDEX IX_Applications_Tenant   ON Applications (tenant_id);
CREATE INDEX IX_Applications_Property ON Applications (property_id);
CREATE INDEX IX_Applications_Status   ON Applications (status);
