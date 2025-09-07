exports.up = (pgm) => {
  pgm.createTable("listings", {
    listing_id: "id",
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"(id)"',
    },
    category_id: {
      type: "integer",
      notNull: true,
      references: '"categories"(id)',
    },
    title: {
      type: "varchar(255)",
    },
    description: {
      type: "varchar(255)",
    },
    price: {
      type: "numeric",
      notNull: true,
    },
    condition: {
      type: "varchar(255)",
    },
    quantity: {
      type: "integer",
      notNull: true,
    },
    active: {
      // possivelmente n é booleano mas eai
      type: "boolean",
      notNull: true,
      default: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("listings");
};
