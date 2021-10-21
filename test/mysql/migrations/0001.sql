/* init table */
CREATE TABLE `things` (
  `id` int NOT NULL AUTO_INCREMENT,       
  `thing` varchar(16) NOT NULL,
  PRIMARY KEY (`id`)
);


### DOWN

DROP table `things`;