# Data Flow Diagrams

## Lead Capture Flow

```
Public Website → API Gateway → Lead Service → Database
                                    ↓
                            Notification Service (SMS/Email)
                                    ↓
                            CMS Dashboard (Lead Pipeline)
```

## Subscription and Billing Flow

```
Subscriber → API Gateway → Subscription Service → Database
                                    ↓
                            Billing Service (Generate Invoice)
                                    ↓
                            Payment Service (Cashfree)
                                    ↓
                            Billing Service (Mark Paid)
                                    ↓
                            Media Service (Generate PDF)
                                    ↓
                            Notification Service (Send Receipt)
```

## Ticket and Technician Flow

```
Subscriber → API Gateway → Ticket Service → Database
                                    ↓
                            Assignment Service (Assign Technician)
                                    ↓
                            Technician App (View Jobs)
                                    ↓
                            Ticket Service (Update Status)
                                    ↓
                            Media Service (Upload Photos)
                                    ↓
                            Notification Service (Notify Subscriber)
```
