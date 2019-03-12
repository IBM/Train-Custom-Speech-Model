s/__*[a-zA-Z0-9:-]*//
s/{period}/ . /g
s/{comma}/ , /g
s/YYYY//g
s/yyyy//g
s/xxx//g
s/xx//g
s/XXXXX//g
s/xxxx//g
s/.Next/. Next/g
s/HEENT:/HEENT :/g
s/\[skip\]//g
s/ dication/ dictation/g 
s/ dicharge/ discharge/g
s/ wsould/ would/g
s/\([.]\) \([[:upper:]]\)/\1\
\2/g
