CREATE DATABASE IF NOT EXISTS `mailwave`;
USE `mailwave`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` text,
  `avatar` varchar(10) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `contacts` (
  `id` varchar(100) NOT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `emails` (
  `id` varchar(100) NOT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `message_id` varchar(255) DEFAULT NULL,
  `from_address` varchar(255) DEFAULT NULL,
  `from_name` varchar(255) DEFAULT NULL,
  `to_address` varchar(255) DEFAULT NULL,
  `cc` text,
  `bcc` text,
  `subject` text,
  `body` longtext,
  `body_plain` longtext,
  `folder` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `is_starred` tinyint(1) DEFAULT '0',
  `is_important` tinyint(1) DEFAULT '0',
  `smtp_sent` tinyint(1) DEFAULT '0',
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `drafts` (
  `id` varchar(100) NOT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `to_address` varchar(255) DEFAULT NULL,
  `cc` text,
  `bcc` text,
  `subject` text,
  `body` longtext,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;