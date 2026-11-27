#!/usr/bin/env bash
# Concatenate the page parts in src/ into ransom.html (the render page).
cd "$(dirname "$0")/src" && cat a_engine.html b_helpers.js c_common.js d_time.js e0_parts.js e_office.js f_firm.js g_fbi.js h_vegas.js i_states.js j_shots.js k_over.js h_post.js z_end.html > ../ransom.html
