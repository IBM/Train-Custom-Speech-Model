import glob
from striprtf.striprtf import rtf_to_text

if __name__ == '__main__':
    rtf_files = glob.glob('Documents/*.rtf')
    for rtf_name in rtf_files:
        txt_name = rtf_name.replace('.rtf','.txt')
        txt_file = open(txt_name, "x")
        content_txt = rtf_to_text(open(rtf_name).read())
        txt_file.write(content_txt)
        txt_file.close()
