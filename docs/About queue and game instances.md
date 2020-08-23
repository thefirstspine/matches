About queue and game instances
===
Queues & game instances are the core concepts in the Arena service. Queues instances can be created through the API and can be joined by every players. It is used to create game instance based on the parameters provided during the creation of the queue, and when a player is joining a queue.
A game instance cannot be created or deleted though the API.
```
+------------+ +----------------+ +---------+
| gameTypeId +----------->+ QUEUE INSTANCE +&lt;------+ origin |
| theme | Queue +-------+--------+ Joins | destiny |
| modifiers | creation | queue | style |
+------------+ | | cover |
| +---------+
v
+-------+--------+
| GAME INSTANCE |
+----------------+
]]&gt;
```
