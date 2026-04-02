-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 05, 2025 at 01:19 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tabdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `candidates`
--

CREATE TABLE `candidates` (
  `id` int(11) NOT NULL,
  `candidate_no` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('1','2') NOT NULL,
  `event_id` int(11) NOT NULL,
  `photo` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `criteria`
--

CREATE TABLE `criteria` (
  `id` int(11) NOT NULL,
  `criteria_name` varchar(100) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  `percentage` decimal(5,2) DEFAULT 0.00,
  `min_score` decimal(5,2) DEFAULT 1.00,
  `max_score` decimal(5,2) DEFAULT 10.00,
  `event_id` int(11) DEFAULT NULL,
  `round_type` enum('regular','top10','top5','top3') DEFAULT 'regular'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `event_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scores`
--

CREATE TABLE `scores` (
  `id` int(11) NOT NULL,
  `judge_id` int(11) NOT NULL,
  `candidate_id` int(11) NOT NULL,
  `criteria_id` int(11) NOT NULL,
  `round_type` enum('regular','top10','top5','top3') DEFAULT 'regular',
  `subcriteria_id` int(11) DEFAULT NULL,
  `score` decimal(5,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Triggers `scores`
--
DELIMITER $$
CREATE TRIGGER `validate_score_round_type_before_insert` BEFORE INSERT ON `scores` FOR EACH ROW BEGIN
    DECLARE criteria_round_type VARCHAR(10);
    
    -- Get the round_type from criteria table
    SELECT round_type INTO criteria_round_type
    FROM criteria
    WHERE id = NEW.criteria_id;
    
    -- Check if round_type matches
    IF criteria_round_type IS NOT NULL AND NEW.round_type != criteria_round_type THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Score round_type must match the criteria round_type';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `validate_score_round_type_before_update` BEFORE UPDATE ON `scores` FOR EACH ROW BEGIN
    DECLARE criteria_round_type VARCHAR(10);
    
    -- Get the round_type from criteria table
    SELECT round_type INTO criteria_round_type
    FROM criteria
    WHERE id = NEW.criteria_id;
    
    -- Check if round_type matches
    IF criteria_round_type IS NOT NULL AND NEW.round_type != criteria_round_type THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Score round_type must match the criteria round_type';
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `selected_data`
--

CREATE TABLE `selected_data` (
  `id` int(11) NOT NULL,
  `candidate_id` int(11) DEFAULT NULL,
  `event_id` int(11) DEFAULT NULL,
  `criteria_id` int(11) DEFAULT NULL,
  `candidate_number` varchar(10) DEFAULT NULL,
  `candidate_name` varchar(100) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `event_name` varchar(100) DEFAULT NULL,
  `criteria_name` varchar(100) DEFAULT NULL,
  `category` enum('1','2') DEFAULT NULL,
  `judge_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `should_refresh`
--

CREATE TABLE `should_refresh` (
  `id` int(11) NOT NULL,
  `value` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `should_refresh`
--

INSERT INTO `should_refresh` (`id`, `value`) VALUES
(1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `sub_criteria`
--

CREATE TABLE `sub_criteria` (
  `id` int(11) NOT NULL,
  `criteria_id` int(11) DEFAULT NULL,
  `sub_criteria_name` varchar(255) NOT NULL,
  `min_score` decimal(5,2) DEFAULT 1.00,
  `max_score` decimal(5,2) DEFAULT 10.00,
  `percentage` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','judge') NOT NULL,
  `is_active` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `is_active`) VALUES
(12, 'admin', '21232f297a57a5a743894a0e4a801fc3', 'admin', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `candidates`
--
ALTER TABLE `candidates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `criteria`
--
ALTER TABLE `criteria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `criteria_event_fk` (`event_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `scores`
--
ALTER TABLE `scores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `judge_id` (`judge_id`),
  ADD KEY `candidate_id` (`candidate_id`),
  ADD KEY `criteria_id` (`criteria_id`),
  ADD KEY `subcriteria_id` (`subcriteria_id`),
  ADD KEY `idx_round_type` (`round_type`);

--
-- Indexes for table `selected_data`
--
ALTER TABLE `selected_data`
  ADD PRIMARY KEY (`id`),
  ADD KEY `judge_id` (`judge_id`),
  ADD KEY `selected_data_candidate` (`candidate_id`),
  ADD KEY `selected_data_event` (`event_id`),
  ADD KEY `selected_data_criteria` (`criteria_id`);

--
-- Indexes for table `sub_criteria`
--
ALTER TABLE `sub_criteria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `criteria_id` (`criteria_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `candidates`
--
ALTER TABLE `candidates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `criteria`
--
ALTER TABLE `criteria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `scores`
--
ALTER TABLE `scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `selected_data`
--
ALTER TABLE `selected_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sub_criteria`
--
ALTER TABLE `sub_criteria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `candidates`
--
ALTER TABLE `candidates`
  ADD CONSTRAINT `candidates_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `criteria`
--
ALTER TABLE `criteria`
  ADD CONSTRAINT `criteria_event_fk` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `scores`
--
ALTER TABLE `scores`
  ADD CONSTRAINT `scores_candidate_fk` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scores_criteria_fk` FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scores_judge_fk` FOREIGN KEY (`judge_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scores_subcriteria_fk` FOREIGN KEY (`subcriteria_id`) REFERENCES `sub_criteria` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `selected_data`
--
ALTER TABLE `selected_data`
  ADD CONSTRAINT `selected_data_candidate` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `selected_data_criteria` FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `selected_data_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `selected_data_judge` FOREIGN KEY (`judge_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sub_criteria`
--
ALTER TABLE `sub_criteria`
  ADD CONSTRAINT `sub_criteria_criteria_fk` FOREIGN KEY (`criteria_id`) REFERENCES `criteria` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
