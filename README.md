# 📈 Investment Portfolio Performance Tracker

[![Built with React, Node.js, MySQL, Python, Docker](https://img.shields.io/badge/Built%20with-React%2C%20Node.js%2C%20MySQL%2C%20Python%2C%20Docker-blue)]()

**Investment Portfolio Performance Tracker** is a powerful web application that helps users monitor and analyze the performance of their stock market investment portfolios.  
Built with **React**, **Node.js**, **MySQL**, and **Python**, it provides **real-time data** updates and **interactive visualizations** for an enhanced investment tracking experience.

---

## 📚 Table of Contents

- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [Installation Guide](#-installation-guide)
- [Tech Stack](#-tech-stack)
- [Real-Time Data Source](#-real-time-data-source)
- [Purpose](#-purpose)

---

## 🔗 Live Demo

![](./demo/demo.gif)

---

## ✨ Key Features

- Track the performance of multiple stock portfolios in real-time
- Interactive, dynamic charts and graphs for detailed insights
- Real-time market data integration powered by the `yfinance` Python library
- User-friendly dashboard with personalized metrics
- Built using a robust tech stack: React (frontend), Node.js (backend API), MySQL (database), Python (data processing), and Docker

---

## 🔧 Installation Guide

To run the application locally you firstly need to make sure that 🐳 [Docker](https://docs.docker.com/engine/install/) and 🐳 [Docker Compose](https://docs.docker.com/compose/install/) are installed and set on your system.

After installing Docker and Docker Compose, clone the repository and run:

```
cd /your-local-path/portfolio-management

```

Then, within /portfolio-management directory run:

```
sudo docker compose build

```

Docker will download all the dependencies and build all the images and containers. Containers include a MySQL database, an API to connect the front end with the database, an nginx server to serve the front end, a phpmyadmin to manage the database.

Finally, run:

```
sudo docker compose up

```

Docker will run all the containers and connect them. You can access the app at http://localhost:8080/ .

Ports to access each component:

- **Application**: 8080
- **API**: 5000
- **Database**: 3310
- **phpmyadmin**: 8081
- **nginx**: 80

---

## 🚀 Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js (Express)
- **Database**: MySQL
- **Data Processing**: Python
- **Real-Time Data**: [yfinance](https://github.com/ranaroussi/yfinance) library

---

## 🛠 Real-Time Data Source

This application uses the [`yfinance`](https://github.com/ranaroussi/yfinance) library to retrieve live stock market data.  
`yfinance` is an open-source library that provides a reliable and convenient way to access financial data from Yahoo Finance.

> **Reference**:
>
> - [`yfinance` GitHub Repository](https://github.com/ranaroussi/yfinance)
> - Licensed under the Apache 2.0 License.

---

## 🎯 Purpose

Managing and growing investment portfolios requires timely insights and performance tracking.  
This application aims to empower investors by providing a centralized platform to monitor their holdings, analyze trends, and make informed decisions based on live market movements.

---
