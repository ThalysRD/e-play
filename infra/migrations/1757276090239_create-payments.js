exports.up = (pgm) => {
  pgm.createTable("payments", {
    id: "id",
    order_id: {
      type: "integer",
      notNull: true,
      references: '"orders"(id)',
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
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("payments");
};
