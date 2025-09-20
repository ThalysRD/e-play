exports.up = (pgm) => {
  pgm.createTable("shipments", {
    id: "id",
    order_id: {
      type: "integer",
      notNull: true,
      references: '"orders"(id)',
    },
    tracking_code: {
      type: "varchar(255)",
      notNull: true,
    },
    shipping_status: {
      type: "varchar(255)",
      notNull: true,
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
  pgm.dropTable("shipments");
};
