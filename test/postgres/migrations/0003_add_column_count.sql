/* add count column */
ALTER TABLE things
ADD count int default 1;

### DOWN

ALTER TABLE things DROP COLUMN count