import pandas as pd, sys
sys.stdout.reconfigure(encoding='utf-8')
path = r'C:\Users\Administrator\Desktop\测井试题总题库.xlsx'
df = pd.read_excel(path, sheet_name='queTemplate', skiprows=[0])
df.columns = ['题型','难度','分数','业务分类','题目内容','参考答案','答案解析','是否子题','opt1','opt2','opt3','opt4']

print('题型分布:', df['题型'].value_counts().to_dict())
print('难度分布:', df['难度'].value_counts().to_dict())
print('有解析的题:', df['答案解析'].notna().sum(), '/', len(df))
print('是子题的:', (df['是否子题']=='y').sum())

# check answer format per type
for t in ['单选题','多选题','判断题']:
    sub = df[df['题型']==t]
    print(f'\n{t} ({len(sub)}):')
    print(f'  答案样本: {sub["参考答案"].iloc[0] if len(sub)>0 else "N/A"}')
    print(f'  答案去重前10: {sub["参考答案"].value_counts().head(5).to_dict()}')

# sample a 多选题 with explanation
mc = df[df['题型']=='多选题']
has_explain = mc[mc['答案解析'].notna()]
if len(has_explain):
    r = has_explain.iloc[0]
    print(f'\n多选题样本(有解析): Q={r["题目内容"]} Ans={r["参考答案"]} Explain={r["答案解析"]}')
    opts = [v for v in [r['opt1'],r['opt2'],r['opt3'],r['opt4']] if pd.notna(v)]
    print(f'  Options: {opts}')
