// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from "./0000_third_meltdown.sql";
import m0001 from "./0001_nostalgic_tomas.sql";
import m0002 from "./0002_illegal_tomorrow_man.sql";
import m0003 from "./0003_fts_foods.sql";
import m0004 from "./0004_hesitant_photon.sql";
import m0005 from "./0005_famous_living_tribunal.sql";
import m0006 from "./0006_amused_tony_stark.sql";
import m0007 from "./0007_square_thor_girl.sql";
import journal from "./meta/_journal.json";

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002,
		m0003,
		m0004,
		m0005,
		m0006,
		m0007,
	},
};
