-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2025-04-13 01:57:42
-- 伺服器版本： 10.4.26-MariaDB-log
-- PHP 版本： 8.2.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `ricecall`
--

-- --------------------------------------------------------

--
-- 資料表結構 `accounts`
--

CREATE TABLE `accounts` (
  `account` varchar(255) NOT NULL,
  `password` char(60) NOT NULL COMMENT 'BCRYPT',
  `user_id` char(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `badges`
--

CREATE TABLE `badges` (
  `badge_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT 'Unknown',
  `description` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `channels`
--

CREATE TABLE `channels` (
  `channel_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `bitrate` int(10) UNSIGNED NOT NULL DEFAULT 64000,
  `user_limit` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `guest_text_gap_time` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `guest_text_wait_time` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `guest_text_max_length` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_root` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `is_lobby` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `slowmode` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `forbid_text` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `forbid_guest_text` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `forbid_guest_url` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `type` varchar(255) NOT NULL DEFAULT 'channel',
  `visibility` varchar(255) NOT NULL DEFAULT 'public',
  `voice_mode` varchar(255) NOT NULL DEFAULT 'free',
  `category_id` char(36) DEFAULT NULL,
  `server_id` char(36) NOT NULL,
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `direct_messages`
--

CREATE TABLE `direct_messages` (
  `direct_message_id` char(36) NOT NULL,
  `content` text NOT NULL DEFAULT '',
  `type` varchar(255) NOT NULL DEFAULT 'dm',
  `sender_id` char(36) NOT NULL,
  `user1_id` char(36) NOT NULL,
  `user2_id` char(36) NOT NULL,
  `timestamp` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `friends`
--

CREATE TABLE `friends` (
  `user_id` char(36) NOT NULL,
  `target_id` char(36) NOT NULL,
  `is_blocked` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `friend_group_id` char(36) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `friend_applications`
--

CREATE TABLE `friend_applications` (
  `sender_id` char(36) NOT NULL,
  `receiver_id` char(36) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `friend_groups`
--

CREATE TABLE `friend_groups` (
  `friend_group_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `user_id` char(36) NOT NULL,
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `members`
--

CREATE TABLE `members` (
  `user_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `nickname` varchar(255) DEFAULT NULL,
  `contribution` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `last_message_time` bigint(20) NOT NULL DEFAULT 0,
  `last_join_channel_time` bigint(20) NOT NULL DEFAULT 0,
  `permission_level` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_blocked` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `member_applications`
--

CREATE TABLE `member_applications` (
  `user_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `description` varchar(255) NOT NULL DEFAULT '',
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `messages`
--

CREATE TABLE `messages` (
  `message_id` char(36) NOT NULL,
  `content` text NOT NULL DEFAULT '',
  `type` varchar(255) NOT NULL DEFAULT 'general',
  `sender_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `channel_id` char(36) NOT NULL,
  `timestamp` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `servers`
--

CREATE TABLE `servers` (
  `server_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `avatar` varchar(255) NOT NULL DEFAULT '',
  `avatar_url` varchar(255) NOT NULL DEFAULT '',
  `announcement` text NOT NULL DEFAULT '',
  `apply_notice` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `display_id` varchar(24) NOT NULL DEFAULT '',
  `slogan` varchar(255) NOT NULL DEFAULT '',
  `level` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `wealth` int(1) UNSIGNED NOT NULL DEFAULT 0,
  `receive_apply` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `allow_direct_message` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `type` varchar(255) NOT NULL DEFAULT 'game',
  `visibility` varchar(255) NOT NULL DEFAULT 'public',
  `lobby_id` char(36) DEFAULT NULL,
  `owner_id` char(36) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `users`
--

CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `avatar` varchar(255) NOT NULL DEFAULT '',
  `avatar_url` varchar(255) NOT NULL DEFAULT '',
  `signature` varchar(255) NOT NULL DEFAULT '',
  `country` varchar(48) NOT NULL DEFAULT 'taiwan',
  `level` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `vip` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `xp` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `required_xp` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `progress` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `birth_year` smallint(5) UNSIGNED NOT NULL DEFAULT 1900,
  `birth_month` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `birth_day` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `status` varchar(255) NOT NULL DEFAULT 'offline',
  `gender` varchar(255) NOT NULL DEFAULT 'Male',
  `current_channel_id` char(36) DEFAULT NULL,
  `current_server_id` char(36) DEFAULT NULL,
  `last_active_at` bigint(20) NOT NULL DEFAULT 0,
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `user_badges`
--

CREATE TABLE `user_badges` (
  `user_id` char(36) NOT NULL,
  `badge_id` char(36) NOT NULL,
  `order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 資料表結構 `user_servers`
--

CREATE TABLE `user_servers` (
  `user_id` char(36) NOT NULL,
  `server_id` char(36) NOT NULL,
  `owned` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `recent` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `favorite` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `timestamp` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`account`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `badges`
--
ALTER TABLE `badges`
  ADD PRIMARY KEY (`badge_id`);

--
-- 資料表索引 `channels`
--
ALTER TABLE `channels`
  ADD PRIMARY KEY (`channel_id`);

--
-- 資料表索引 `direct_messages`
--
ALTER TABLE `direct_messages`
  ADD PRIMARY KEY (`direct_message_id`),
  ADD KEY `user1_id` (`user1_id`) USING BTREE,
  ADD KEY `user2_id` (`user2_id`) USING BTREE;

--
-- 資料表索引 `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`user_id`,`target_id`),
  ADD KEY `friend_group_id` (`friend_group_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `target_id` (`target_id`);

--
-- 資料表索引 `friend_applications`
--
ALTER TABLE `friend_applications`
  ADD PRIMARY KEY (`sender_id`,`receiver_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- 資料表索引 `friend_groups`
--
ALTER TABLE `friend_groups`
  ADD PRIMARY KEY (`friend_group_id`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`user_id`,`server_id`),
  ADD KEY `server_id` (`server_id`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `member_applications`
--
ALTER TABLE `member_applications`
  ADD PRIMARY KEY (`user_id`,`server_id`),
  ADD KEY `server_id` (`server_id`),
  ADD KEY `user_id` (`user_id`);

--
-- 資料表索引 `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `channel_id` (`channel_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `server_id` (`server_id`);

--
-- 資料表索引 `servers`
--
ALTER TABLE `servers`
  ADD PRIMARY KEY (`server_id`),
  ADD KEY `owner_id` (`owner_id`),
  ADD KEY `lobby_id` (`lobby_id`);

--
-- 資料表索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `current_channel_id` (`current_channel_id`),
  ADD KEY `current_server_id` (`current_server_id`);

--
-- 資料表索引 `user_badges`
--
ALTER TABLE `user_badges`
  ADD PRIMARY KEY (`user_id`,`badge_id`),
  ADD KEY `badge_id` (`badge_id`);

--
-- 資料表索引 `user_servers`
--
ALTER TABLE `user_servers`
  ADD PRIMARY KEY (`user_id`,`server_id`),
  ADD KEY `server_id` (`server_id`);

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `direct_messages`
--
ALTER TABLE `direct_messages`
  ADD CONSTRAINT `direct_messages_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `direct_messages_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `friends`
--
ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`friend_group_id`) REFERENCES `friend_groups` (`friend_group_id`),
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `friends_ibfk_3` FOREIGN KEY (`target_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `friend_applications`
--
ALTER TABLE `friend_applications`
  ADD CONSTRAINT `friend_applications_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `friend_applications_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `friend_groups`
--
ALTER TABLE `friend_groups`
  ADD CONSTRAINT `friend_groups_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`server_id`),
  ADD CONSTRAINT `members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `member_applications`
--
ALTER TABLE `member_applications`
  ADD CONSTRAINT `member_applications_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`server_id`),
  ADD CONSTRAINT `member_applications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`channel_id`) REFERENCES `channels` (`channel_id`),
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`server_id`) REFERENCES `servers` (`server_id`);

--
-- 資料表的限制式 `servers`
--
ALTER TABLE `servers`
  ADD CONSTRAINT `servers_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `servers_ibfk_2` FOREIGN KEY (`lobby_id`) REFERENCES `channels` (`channel_id`);

--
-- 資料表的限制式 `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`current_channel_id`) REFERENCES `channels` (`channel_id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`current_server_id`) REFERENCES `servers` (`server_id`);

--
-- 資料表的限制式 `user_badges`
--
ALTER TABLE `user_badges`
  ADD CONSTRAINT `user_badges_ibfk_1` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`badge_id`),
  ADD CONSTRAINT `user_badges_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- 資料表的限制式 `user_servers`
--
ALTER TABLE `user_servers`
  ADD CONSTRAINT `user_servers_ibfk_1` FOREIGN KEY (`server_id`) REFERENCES `servers` (`server_id`),
  ADD CONSTRAINT `user_servers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
