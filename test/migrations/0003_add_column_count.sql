/* add count column */
ALTER TABLE things
ADD count int(5) default 1;

### DOWN

    CREATE TABLE `new_things` (
    `id` INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,       
    `thing` TEXT  NOT NULL default ''
    );
###
    INSERT INTO new_things SELECT id,thing FROM things;
###
    DROP TABLE things;
###
    ALTER TABLE new_things RENAME TO things