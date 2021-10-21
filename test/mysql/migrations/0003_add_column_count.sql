/* add count column */
ALTER TABLE things
ADD count int(5) default 1;

### DOWN

ALTER TABLE things DROP COLUMN count