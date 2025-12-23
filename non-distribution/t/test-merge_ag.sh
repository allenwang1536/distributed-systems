#!/bin/bash

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
DIFF_PERCENT=${DIFF_PERCENT:-0}

t_c()
{
    t=$1
    cat /dev/null > d/global-index.txt

    files=("${@:2}")

    for file in "${files[@]}"
    do
	cat "$file" | c/merge.js d/global-index.txt > d/temp-global-index.txt
	mv d/temp-global-index.txt d/global-index.txt
    done

    if DIFF_PERCENT=$DIFF_PERCENT t/gi-diff.js <(sort d/global-index.txt) <(sort "$T_FOLDER"/d/merge-out-"$t".txt) >&2;
    then
	echo "$0 success: global indexes are identical"
    else
	echo "$0 failure: global indexes are not identical"
  exit 1
    fi
}


t_c "1" "$T_FOLDER"/d/merge-in-1.txt
t_c "2" "$T_FOLDER"/d/merge-in-{1..3}.txt
t_c "3" "$T_FOLDER"/d/merge-in-{1..5}.txt
t_c "4" "$T_FOLDER"/d/merge-in-{1..10}.txt
