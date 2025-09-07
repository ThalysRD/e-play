exports.up = (pgm) => {
  pgm.createTable("payments", {
    payment_id: "id",
    order_id: {
      type: "integer",
      notNull: true,
      references: '"orders"(id)"',
    },
    amount: {
      type: "integer",
      notNull: true,
    },
    method: {
      type: "varchar(255)",
    },
    status: {
      type: "varchar(255)",
    },
    payment_date: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("payments");
};
