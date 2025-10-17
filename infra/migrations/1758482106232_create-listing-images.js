exports.up = (pgm) => {
  pgm.createTable("listing_images", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    listing_id: {
      type: "uuid",
      notNull: true,
      references: '"listings"(id)',
      onDelete: "CASCADE",
    },
    image_url: {
      type: "varchar(500)",
      notNull: true,
    },
    display_order: {
      type: "integer",
      notNull: true,
      default: 0,
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

  pgm.createIndex("listing_images", "listing_id");
};

exports.down = (pgm) => {
  pgm.dropTable("listing_images");
};
