import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn import metrics


df = pd.read_csv('statistics.csv')


df['Time'] = pd.to_datetime(df['Time'], format='%Y-%m-%d %H:%M:%S')


def time_graph(t,filename):
    plt.figure(figsize=(10, 6))
    plt.plot(df['Time'], df[t], marker='o', linestyle='-', color='b', label=t)
    plt.title(f'{t} Over Time')
    plt.xlabel('Time')
    plt.ylabel(t)
    plt.xticks(rotation=45)
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig(filename)


def density_plot(t,filename):
    sns.kdeplot(t)
    plt.savefig(filename)


#Mainstream Stats
summary_statistic = df[['HeartRate','BP_sys','BP_dia','MAP','Body Humidity','Body Temperature']].describe()
print(summary_statistic)


factors = ['HeartRate','BP_sys','BP_dia','MAP','Body Humidity','Body Temperature','Happiness(%)']


time_graph('HeartRate','heart.png')
time_graph('Happiness(%)','happy.png')
density_plot(df['MAP'],'map.png')
density_plot(df['Body Temperature'],'temp.png')




#Some Data Visualisations
#for f in factors: time_graph(f)
#for f in factors: density_plot(df[f])


#Muliple Linear Regression Model:
X = df[['HeartRate','BP_sys','BP_dia','MAP','Body Humidity','Body Temperature']]
y = df['Happiness(%)']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = LinearRegression()
model.fit(X_train, y_train)
Y_pred = model.predict(X_test)


#Reliability of Prediction:
print('Mean Absolute Error:', metrics.mean_absolute_error(y_test, Y_pred))
print('Mean Squared Error:', metrics.mean_squared_error(y_test, Y_pred))
print('R-squared:', metrics.r2_score(y_test, Y_pred))


#User inputs some data (maybe through a form):
user_stats = [76, 122, 80, 92, 46, 36]
user_stats_reshaped = np.array(user_stats).reshape(1, -1)
model_prediction = model.predict(user_stats_reshaped)
print(f"Predicted Happiness(%): {model_prediction[0]:.2f}")