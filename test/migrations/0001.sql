/* init table */
CREATE TABLE `things` (
  `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,       
  `thing` TEXT  NOT NULL default ''
);


### DOWN

DROP table `things`;