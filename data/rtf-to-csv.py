# Converts all rtf files in a given folder into a single CSV with 
# a file name column.  This is intended for use in preprocessing 
# RTF files typically used by the medical industry for consumption
# outside of Windows.
#
# This requires the striprtf module to be installed.
from __future__ import print_function
from striprtf.striprtf import rtf_to_text

import csv
import os
import sys

def main(folder):
    replacement_dict = {'{period}':'.', '{comma}':',', 'YYYY': '',
                        'yyyy':'', 'xxx':'', 'xx':'', 'XXXXX': '',
                        'xxxx':'', '.Next':'. Next', 'HEENT:':'HEENT :',
                        '[skip\]':'', 'dication': 'dictation', 'wsould': 'would'
                        }
    trans_dict = {'Filename': 'Text'}
    all_files = os.listdir(folder)
    for file in all_files:
        if file.endswith('.rtf'):
            filename = file.replace('.rtf', '.wav')
            with open(file) as source:
                text = rtf_to_text(source.read())
            for i, j in replacement_dict.items():
                text = text.replace(i, j)
            trans_dict = {filename : text}
            with open('documents.csv', 'a') as f:
                w = csv.writer(f)
                for k, v in trans_dict.items():
                    w.writerow([k, v])

if __name__ == "__main__":
    if len(sys.argv) !=2:
        print('Converts a folder of RTF\'s into a single CSV.')
        print('Usage: %s folder path' % sys.argv[0])
    else:
        main(sys.argv[1])
