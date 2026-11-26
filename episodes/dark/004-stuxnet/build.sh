#!/usr/bin/env bash
# Concatenate the page parts in src/ into stux.html (the render page).
cd "$(dirname "$0")/src" && cat a_engine.html b_helpers.js c_common.js e_lab.js f_hall.js g_desert.js h_ops.js d_time.js i_states.js j_shots.js k_over.js h_post.js z_end.html > ../stux.html
