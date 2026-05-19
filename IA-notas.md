## Atributos de distintas tablas de wikidata

### Batallas

| Atributo              | Identificador      | Comentarios                                                                      |
| --------------------- | ------------------ | -------------------------------------------------------------------------------- |
| image                 | P18                |                                                                                  |
| coordinate location   | P625               | #WGS84                                                                           |
| point in time         | P585               | Un solo día                                                                      |
| country               | P17                |                                                                                  |
| start time            | P580               |                                                                                  |
| end time              | P582               |                                                                                  |
| part of               | P361               |                                                                                  |
| locator map image     | P242               |                                                                                  |
| location              | P276               |                                                                                  |
| participant           | P710               | Salen varios sin indicar los bandos                                              |
| number of deaths      | P1120              | Total del número de muertos                                                      |
| number of casualities | P1590              | Used when precise data on number of deaths and number of injured is unavailable. |
| label                 | rdfs:label         |                                                                                  |
| description           | schema:description |                                                                                  |
|                       |                    |                                                                                  |

### Guerras

| Atributo         | Identificador      | Comentarios                                                                            |
| ---------------- | ------------------ | -------------------------------------------------------------------------------------- |
| image            | P18                |                                                                                        |
| location         | P276               | Puede ser múltiple                                                                     |
| start time       | P580               |                                                                                        |
| end time         | P582               |                                                                                        |
| participant      | P710               |                                                                                        |
| number of deaths | P1120              |                                                                                        |
| has part(s)      | P527               | Aparecen subguerras y batallas, habría que quedarse solo con las batallas en todo caso |
| label            | rdfs:label         |                                                                                        |
| description      | schema:description |                                                                                        |

### Comandantes

| Atributos                        | Identificador      | Comentarios                                              |
| -------------------------------- | ------------------ | -------------------------------------------------------- |
| image                            | P18                |                                                          |
| country of citizenship           | P27                |                                                          |
| label                            | rdfs:label         |                                                          |
| description                      | schema:description |                                                          |
| (alias)                          | skos:altLabel      |                                                          |
| place of birth                   | P19                |                                                          |
| date of death                    | P570               |                                                          |
| place of death                   | P20                |                                                          |
| cause of death                   | P509               |                                                          |
| military, police or special rank | P410               | Salen varios con <br>start time (P580) y end time (P582) |
| participated in conflict         | P607               | Los varios conflictos en los que participase             |
| date of birth                    | P569               |                                                          |
|                                  |                    |                                                          |

Para cada uno, sacar descripciones directamente de la api de wikipedia, por ejemplo:

https://es.wikipedia.org/api/rest_v1/page/summary/Napole%C3%B3n_Bonaparte


## Fragmento de pregunta a claude y respuesta

El siguiente texto muestra una pregunta que se le hizo a claude sonnet, junto con la respuesta que dío. La pregunta
se hizo por una preocupación lógica.

Como puedo obtener:

    Los bandos de una batalla
    Los comandantes de una batalla divididos en bandos
    Las batallas de una guerra
    Las guerras en las que esta involucrada una batalla

16:18

Para cada caso necesitas una query distinta porque Wikidata estructura esto de formas diferentes.
1. Bandos de una batalla

Los bandos están en P710 (participant). Para Lepanto:
sparql

SELECT ?factionLabel ?flagUrl WHERE {
  wd:Q165425 p:P710 ?stmt.
  ?stmt ps:P710 ?faction.
  OPTIONAL { ?faction wdt:P41 ?flagUrl. }  # bandera
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}

2. Comandantes divididos por bando

Aquí es donde entran los qualifiers. El comandante no está en la batalla directamente, sino como qualifier del bando:
sparql

SELECT ?factionLabel ?commanderLabel ?commanderWikidataId WHERE {
  wd:Q165425 p:P710 ?stmt.
  ?stmt ps:P710 ?faction.
  OPTIONAL {
    ?stmt pq:P4791 ?commander.  # commanded by (qualifier)
    BIND(REPLACE(STR(?commander), ".*entity/", "") AS ?commanderWikidataId)
  }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}

Te devuelve filas así:

factionLabel          | commanderLabel
----------------------|------------------
Hispanic Monarchy     | John of Austria
Hispanic Monarchy     | Álvaro de Bazán
Republic of Venice    | Sebastiano Venier
Ottoman Empire        | Müezzinzade Ali Paşa

3. Batallas de una guerra

Las batallas tienen P361 (part of) apuntando a la guerra. Lo consultas al revés con ?battle wdt:P361 wd:Q362:
sparql

SELECT ?battleLabel ?wikidataId ?date ?wikipediaUrl WHERE {
  ?battle wdt:P31/wdt:P279* wd:Q178561.  # instance of battle
  ?battle wdt:P361 wd:Q362.              # part of WWII

  OPTIONAL { ?battle wdt:P585 ?date. }
  OPTIONAL { ?battle wdt:P580 ?date. }
  OPTIONAL {
    ?wikipediaUrl schema:about ?battle.
    ?wikipediaUrl schema:inLanguage "es".
    ?wikipediaUrl schema:isPartOf <https://es.wikipedia.org/>.
  }
  BIND(REPLACE(STR(?battle), ".*entity/", "") AS ?wikidataId)

  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}

4. Guerras en las que participa una batalla

Una batalla puede ser P361 de varias guerras. Simplemente inviertes la dirección:
sparql

SELECT ?warLabel ?warWikidataId ?dateStart ?dateEnd WHERE {
  wd:Q165425 wdt:P361 ?war.  # Lepanto → part of → ?war
  
  OPTIONAL { ?war wdt:P580 ?dateStart. }
  OPTIONAL { ?war wdt:P582 ?dateEnd. }
  BIND(REPLACE(STR(?war), ".*entity/", "") AS ?warWikidataId)

  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}

Cómo lo combinas en el seed

En la práctica para una batalla haces tres llamadas y las cruzas:
typescript

async function seedBattle(qid: string) {
  // 1. Datos básicos de la batalla
  const battle = await fetchBattleData(qid);

  // 2. Bandos + comandantes (una sola query, la del punto 2)
  const factions = await fetchFactionsWithCommanders(qid);

  // 3. Guerras a las que pertenece
  const wars = await fetchBattleWars(qid);

  // Insertar en BD
  const battleRecord = await prisma.battle.upsert({
    where: { wikidataId: qid },
    create: { ...battle },
    update: { ...battle },
  });

  // Agrupar filas por facción y crear BattleFaction + Commander
  const grouped = groupBy(factions, 'factionLabel');
  for (const [factionName, rows] of Object.entries(grouped)) {
    const faction = await prisma.faction.upsert({
      where: { wikidataId: rows[0].factionWikidataId },
      create: { name: factionName, wikidataId: rows[0].factionWikidataId },
      update: {},
    });

    const bf = await prisma.battleFaction.create({
      data: { battleId: battleRecord.id, factionId: faction.id }
    });

    for (const row of rows.filter(r => r.commanderLabel)) {
      const commander = await prisma.commander.upsert({
        where: { wikidataId: row.commanderWikidataId },
        create: { name: row.commanderLabel, wikidataId: row.commanderWikidataId },
        update: {},
      });
      await prisma.battleFactionCommander.create({
        data: { commanderId: commander.id, battleFactionId: bf.id }
      });
    }
  }

  // Conectar con guerras
  for (const war of wars) {
    const warRecord = await prisma.war.upsert({
      where: { wikidataId: war.warWikidataId },
      create: { name: war.warLabel, wikidataId: war.warWikidataId },
      update: {},
    });
    await prisma.battleWar.upsert({
      where: { battleId_warId: { battleId: battleRecord.id, warId: warRecord.id } },
      create: { battleId: battleRecord.id, warId: warRecord.id },
      update: {},
    });
  }
}

El upsert en lugar de create es clave porque el mismo comandante o facción puede aparecer en múltiples batallas y no quieres duplicados.