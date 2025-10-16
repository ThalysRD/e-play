exports.up = (pgm) => {
  pgm.createType('listing_condition', ['Novo', 'Usado', 'Recondicionado']);

  pgm.createTable("listings", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: '"users"(id)',
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
      type: "text",
    },
    price: {
      type: "numeric",
      notNull: true,
    },
    condition: {
      type: conditionType,
    },
    quantity: {
      type: "integer",
      notNull: true,
    },
    active: {
      type: "boolean",
      notNull: true,
      default: true,
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
  pgm.dropTable("listings");
};
