/* init table */
CREATE TABLE things (
  id SERIAL PRIMARY KEY,       
  thing VARCHAR(16) NOT NULL
);


### DOWN

DROP table things;