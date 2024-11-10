import os, re
from random import randrange

def getQmdFileDictList():
    qmdFilesDictList = []
    for root, dirs, files in os.walk("./../../"):
        for file in files:
            if file.endswith(".qmd"):
                file = os.path.join(root, file)
                file = re.sub(r'\\', '/', file)
                frontMatterState = "NONE"
                mainOption = ""
                with open(file) as fd:
                        blogTitleRefList = [] 
                        conceptTitleRefList = [] 
                        categoryRefList = []
                        categoryList = []
                        for line in fd:
                            if re.match(r'---', line) and frontMatterState == "NONE":
                                frontMatterState = "START"
                            elif re.match(r'---', line) and frontMatterState == "START":
                                frontMatterState = "END"
                                break

                            if re.match(r'^\s+-', line) and mainOption != "":
                                lineVal = re.sub(r'^\s+-\s+', '', line)
                            else:
                                mainOption = ""
                                lineVal = re.sub(r'^.*:\s+', '', line)
                            lineVal = re.sub(r'\n', '', lineVal)

                            if re.match(r'blog|concept|category.*-refs', line):
                                if "blog-title-refs" in line:
                                    mainOption = "blog-title-refs"
                                elif "concept-title-refs" in line:
                                    mainOption = "concept-title-refs"
                                elif "category-refs" in line:
                                    mainOption = "category-refs"
                            elif re.match(r'^title', line):
                                title = lineVal
                            elif re.match(r'^categories', line):
                                mainOption = "categories"
                            elif "blog-title-refs" == mainOption:
                                blogTitleRefList.append(lineVal)
                            elif "concept-title-refs" == mainOption:
                                conceptTitleRefList.append(lineVal)
                            elif "category-refs" == mainOption:
                                categoryRefList.append(lineVal)
                            elif "categories" == mainOption:
                                categoryList.append(lineVal)

                qmdFilesDictList.append({'URI': file, 'TITLE': title, 'CATEGORIES': categoryList, 'BLOG-TITLE-REFS': blogTitleRefList, 'CONCEPT-TITLE-REFS': conceptTitleRefList, 'CATEGORY-REFS': categoryRefList})
    return qmdFilesDictList

def ref():
    #pwd = './blog/20240331'
    #os.chdir(pwd)

    pwd = os.getcwd()
    pwd = re.sub(r'^.*\\', '', pwd)

    curFile = pwd + '/index.qmd'

    qmdFileDictList = getQmdFileDictList()
    refDict = {}
    # List all the titles explicitly referenced in this post
    for qmdFileDict in qmdFileDictList:
        if curFile in qmdFileDict['URI']:
            curQmdFileDict = qmdFileDict
            break

    titleRefList = curQmdFileDict['BLOG-TITLE-REFS'] + curQmdFileDict['CONCEPT-TITLE-REFS']
    curTitle = curQmdFileDict['TITLE']
    for title in titleRefList:
        for qmdFileDict in qmdFileDictList:
            if curFile not in qmdFileDict['URI']  and qmdFileDict['TITLE'] == title:
                if qmdFileDict['URI'] not in refDict:
                    refDict[qmdFileDict['URI']] = {'CATEGORY': 'EGRESS', 'TITLE': qmdFileDict['TITLE']}
           
    # Then list all the posts that reference this article
    for qmdFileDict in qmdFileDictList:
        if curFile not in qmdFileDict['URI']:
            titleRefList = qmdFileDict['BLOG-TITLE-REFS'] + qmdFileDict['CONCEPT-TITLE-REFS']
            if curTitle in titleRefList: 
                if qmdFileDict['URI'] not in refDict:
                    refDict[qmdFileDict['URI']] = {'CATEGORY': 'INGRESS', 'TITLE': qmdFileDict['TITLE']}

    # Then list all the posts that are referenced by the category
    categoryRefList = curQmdFileDict['CATEGORY-REFS']
    for category in categoryRefList:
        for qmdFileDict in qmdFileDictList:
            if curFile not in qmdFileDict['URI'] and category in qmdFileDict['CATEGORIES']:
                if qmdFileDict['URI'] not in refDict:
                    refDict[qmdFileDict['URI']] = {'CATEGORY': 'CAT-REF', 'TITLE': qmdFileDict['TITLE']}

    # Then list all the posts that have some categories in common
    categoryRefList = qmdFileDict['CATEGORIES']
    for category in categoryRefList:
        for qmdFileDict in qmdFileDictList:
            if curFile not in qmdFileDict['URI'] and category in qmdFileDict['CATEGORIES']:
                if qmdFileDict['URI'] not in refDict:
                    refDict[qmdFileDict['URI']] = {'CATEGORY': 'CAT-REF', 'TITLE': qmdFileDict['TITLE']}
    
    count_links = 0
    count_indirectrefs = randrange(1, 3)
    print("<ul>")
    for key, val in refDict.items():
        title = val['TITLE']
        title = re.sub(r'^\"', '', title)
        title = re.sub(r'\"$', '', title)

        if val['CATEGORY'] in ['INGRESS', 'EGRESS']:
            print('<li><a href={}>{}</a></li>'.format(key, title))
        else:
            print('<li><a href={}>{}</a></li>'.format(key, title))
            count_indirectrefs -= 1
        count_links += 1
        if count_indirectrefs == 0 or (count_links >= 5):
            break
    print("</ul>")
