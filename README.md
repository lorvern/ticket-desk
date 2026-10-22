# Ghana Tickets

Build TicketDesk - Modern Event Ticketing Platform for Ghana

Project Overview

Build a complete production-ready web application called TicketDesk.

TicketDesk is an event ticketing platform that allows event organizers to create events, configure ticket categories, manage inventory, sell tickets online, receive payments via Paystack, and automatically generate QR-code tickets for attendees.

The platform must have:

Public Event Website (Buyer Side)

Admin Dashboard (Organizer Side)

Paystack Payment Integration

QR Ticket Generation

Ticket Validation System

Analytics & Sales Dashboard

Coupon & Discount Management

Email Ticket Delivery

Mobile Responsive Design

Multi-event Support

Core Product Vision

The experience should combine:

The premium visual appearance of modern festival ticketing websites

A guided step-by-step purchase flow similar to WhatsApp ticket purchase experiences

Fast checkout with no account creation required

Mobile-first experience optimized for Ghanaian users

The design should feel premium, trustworthy, and modern.

Tech Stack

Use:

Frontend:

Next.js 15

React

TypeScript

Tailwind CSS

shadcn/ui

Framer Motion

Backend:

Supabase

Database:

PostgreSQL (via Supabase)

Authentication:

Supabase Auth

Payments:

Paystack

Email:

Resend

QR Generation:

qrcode package

File Storage:

Supabase Storage

Deployment Ready:

Vercel

User Roles

Super Admin

Can:

Login securely

Create events

Edit events

Delete events

Manage ticket categories

View sales analytics

Export orders

Manage coupons

Manage payment settings

Buyer

Can:

Browse events

View ticket categories

Purchase tickets

Apply coupons

Pay via Paystack

Receive QR ticket

Download ticket

Print ticket

Retrieve ticket using email

No account creation required.

Public Website Pages

Home Page

Display:

Hero banner

Upcoming events

Featured events

Event cards

Search functionality

Category filters

Event Details Page

URL:

/event/[slug]

Display:

Event banner image

Event title

Date

Time

Venue

Description

Organizer information

Available ticket categories

Remaining ticket count

Buy Ticket button

Guided Ticket Purchase Flow

Use a multi-step checkout modal.

Step 1

Select Ticket Category

Display:

Ticket name

Description

Price

Available stock

Examples:

General Admission

VIP

VVIP

Early Bird

Student

Table for 4

Table for 6

Sold-out tickets must remain visible but disabled.

Step 2

Select Quantity

Features:

Plus/Minus controls

Live stock validation

Real-time subtotal updates

Step 3

Order Summary

Display:

Ticket type

Quantity

Ticket subtotal

Handling fee

Discount

Final total

Coupon code field included.

Step 4

Buyer Information

Collect:

Full Name

Email Address

Phone Number

Validation required.

Step 5

Payment

Launch Paystack checkout.

Support:

MTN Mobile Money

Telecel Cash

AirtelTigo Money

Visa

Mastercard

Bank Transfer

Step 6

Payment Verification

Verify payment through secure backend webhook.

Never trust frontend payment response.

Step 7

Ticket Issuance

Generate:

Unique QR Code

Unique Ticket ID

Order Reference

Display:

Download PDF Ticket

Print Ticket

Email Confirmation

QR Ticket Requirements

Each ticket must contain:

Ticket ID

Order ID

Event ID

Ticket Category

Buyer Name

Quantity

Purchase Timestamp

QR codes must be unique.

Duplicate tickets must be impossible.

Admin Dashboard

Create a modern SaaS dashboard.

Dashboard Overview

Display cards for:

Total Revenue

Total Orders

Tickets Sold

Active Events

Conversion Rate

Include charts:

Revenue Trend

Ticket Sales Trend

Top Events

Ticket Category Performance

Event Management

Admin can:

Create Event

Fields:

Event Name

Event Slug

Description

Date

Time

Venue

Banner Image

Organizer Name

Organizer Contact

Event Status

Edit Event

Delete Event

Duplicate Event

Publish Event

Unpublish Event

Ticket Management

For each event:

Create ticket categories.

Fields:

Ticket Name

Category

Price

Quantity

Description

Sale Start Date

Sale End Date

Visibility Status

Inventory should automatically decrease after successful purchase.

Coupon Management

Fields:

Coupon Code

Discount Type

Percentage

Fixed Amount

Expiry Date

Maximum Uses

Active Status

Track usage count.

Orders Management

Display:

Order Reference

Buyer Name

Email

Phone

Event

Ticket Type

Amount

Status

Purchase Date

Filters:

Date

Event

Ticket Type

Status

Export:

CSV

Excel

Settings

Admin can configure:

Paystack Public Key

Paystack Secret Key

Handling Fee Percentage

Company Logo

Brand Colors

Email Templates

Ticket Retrieval System

Create page:

/retrieve-ticket

User enters:

Email Address
OR

Order Reference

System returns:

Ticket Details

QR Code

Download Ticket

Print Ticket

Email Automation

After successful payment:

Send branded email containing:

Event Information

Ticket Information

QR Code

Download Link

Use Resend.

Security Requirements

Passwords must be hashed

Use Row Level Security in Supabase

Verify Paystack webhooks

Rate-limit API routes

Validate all forms

Prevent duplicate purchases

Prevent ticket overselling

Design Requirements

Style:

Premium Event Platform

Colors:

Primary:
#0A0A0A

Accent:
#C9A84C

Background:
#FAFAF8

Typography:

Headings:
Bold modern display font

Body:
Clean sans-serif

UI Requirements:

Elegant ticket cards

Smooth animations

Dark luxury aesthetic

Mobile-first

Accessibility compliant

Database Schema

Create tables:

users
events
ticket_categories
orders
order_items
payments
coupons
coupon_usage
tickets
ticket_scans
settings

Define proper relationships and indexes.

Deliverables

Generate:

Full database schema

Supabase setup

Complete frontend

Complete backend

API routes

Paystack integration

QR generation

Email workflows

Admin dashboard

Deployment instructions

Environment variables

Sample seed data

Build this as a production-grade SaaS application, not a prototype.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ticket-pulse-gh.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ed2cd2df-9ad1-4d9d-a69a-880ab7bfe283).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
