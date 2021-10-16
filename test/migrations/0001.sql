/* init table */
CREATE TABLE `things` (
  `id` int(5) NOT NULL auto_increment,       
  `thing` varchar(50)  NOT NULL default '',
   PRIMARY KEY  (`id`)
);


### DOWN

DROP table `things`;