###########################################################################
# Simple program to convert rtf text file to plain text format
# Input is a file with the .rtf extension
# Output is a plain text file with the same name and the .txt extension
# This program uses the package pyth
# Install by:
#   pip install pyth 
###########################################################################

from pyth.plugins.rtf15.reader import Rtf15Reader
from pyth.plugins.plaintext.writer import PlaintextWriter
import sys

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print 'Convert an rtf file to plain text'
        print 'Usage : %s filename.rtf' % sys.argv[0]
    else:
        input_file = open(sys.argv[1],'r')
        output_file = open(input_file.name.replace('.rtf','') + '.txt','w')
        doc = Rtf15Reader.read(input_file)
        output_file.write(PlaintextWriter.write(doc).getvalue())
        output_file.close()
        input_file.close()

