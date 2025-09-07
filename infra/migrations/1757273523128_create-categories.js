exports.up = (pgm) => {
  pgm.createTable("categories", {
    category_id: "id",
    name: {
      type: "varchar(255)",
      notNull: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("categories");
};
