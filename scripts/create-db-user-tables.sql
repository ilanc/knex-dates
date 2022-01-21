-- database
DROP DATABASE IF EXISTS test;
CREATE DATABASE test;
-- user
DROP USER IF EXISTS 'test' @'%';
CREATE USER 'test' @'%' IDENTIFIED WITH mysql_native_password BY 'test123';
GRANT ALL PRIVILEGES ON test.* TO 'test' @'%';
FLUSH PRIVILEGES;
-- tables
USE test;
create table `dateTable` (
  `id` int unsigned not null auto_increment primary key,
  `message` varchar(255),
  `date1` DATETIME
);
create table `timestampTable` (
  `id` int unsigned not null auto_increment primary key,
  `message` varchar(255),
  `timestamp1` TIMESTAMP
);