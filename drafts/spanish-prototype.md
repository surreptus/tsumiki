# Spanish prototype: compound tenses and clitics

A test of whether the Tsumiki idea carries over to Spanish. It covers only the two places where I expect it to fit. It is not a plan for a full guide, and it has had no native-speaker review.

## The idea, in Spanish

Some Spanish forms are built from pieces, one inside another. Each piece takes one kind of word and returns another kind. Types here are different from the Japanese ones:

| Type | What it is | Example |
| --- | --- | --- |
| infinitive | the dictionary form | comer |
| participle | the "done" form | comido |
| gerund | the "-ing" form | comiendo |
| finite verb | a verb with a person and tense | como, comió |
| verb + pronouns | a verb with pronouns attached | comerlo |

## 1. Compound tenses

Three small functions make the participle, the gerund and the helper verbs, and each helper only accepts one type.

| Function | Takes | Gives | Example |
| --- | --- | --- | --- |
| participle | infinitive | participle | comer → comido |
| gerund | infinitive | gerund | comer → comiendo |
| haber (present) | participle | finite verb | comido → ha comido |
| estar (present) | gerund | finite verb | comiendo → está comiendo |
| ir a | infinitive | finite verb | comer → va a comer |

So the three forms are `haber(participle(comer))`, `estar(gerund(comer))` and `ir_a(comer)`. Written out:

| Step | Add | Result | Meaning |
| --- | --- | --- | --- |
| 0 | | comer | to eat |
| 1 | participle | comido | eaten |
| 2 | haber (ella) | ha comido | she has eaten |

### Why a form is wrong

| Wrong | Why |
| --- | --- |
| ha comer | haber needs a participle, and comer is an infinitive |
| está comido | estar with a participle is a different thing, a state ("is eaten"), not "is eating" |
| va a comiendo | ir a needs an infinitive, and comiendo is a gerund |

### Irregular pieces

The functions are regular for -ar, -er and -ir verbs. The irregular ones are a short list to learn, as in the Japanese guide:

| Infinitive | Participle | Gerund |
| --- | --- | --- |
| hacer | hecho | haciendo |
| decir | dicho | diciendo |
| ver | visto | viendo |
| escribir | escrito | escribiendo |
| abrir | abierto | abriendo |
| dormir | dormido | durmiendo |
| leer | leído | leyendo |

### Stacking

Compound tenses nest like the Japanese chains. *Ha estado comiendo* ("she has been eating") is `haber` around `estar` around the gerund:

| Step | Add | Result |
| --- | --- | --- |
| 0 | | comer |
| 1 | gerund | comiendo |
| 2 | estar, as a participle | estado comiendo |
| 3 | haber (ella) | ha estado comiendo |

## 2. Pronouns that attach to verbs (clitics)

A pronoun attaches to the end of an infinitive, a gerund or an affirmative command, and it comes before other verbs. The order of several pronouns is fixed.

| Verb form | Pronouns go | Example |
| --- | --- | --- |
| infinitive | after | dar + me + lo → dármelo |
| gerund | after | dar + me + lo → dándomelo |
| affirmative command | after | da + me + lo → dámelo |
| finite verb | before | me lo da |
| negative command | before | no me lo des |

The order is: **se, then you (te, os), then me, nos, then lo, la, los, las**. When *le* or *les* would come before *lo*, it becomes *se*:

| Step | Add | Result | Meaning |
| --- | --- | --- | --- |
| 0 | | dar | to give |
| 1 | le + lo → se lo | dárselo | to give it to him or her |

Adding a pronoun to the end of a form often needs a written accent, so the stress stays where it was: *dar* → *dármelo*, *dando* → *dándomelo*. One rule, `accent`, handles this, so it is a function too.

### Pronouns and compound tenses together

| Form | Reading |
| --- | --- |
| Se lo he dado. | I have given it to him. (pronouns before the helper) |
| Voy a dárselo. / Se lo voy a dar. | I am going to give it to him. (both are fine) |
| Estoy dándoselo. / Se lo estoy dando. | I am giving it to him. |

With a helper and an infinitive or gerund, the pronouns can stay on the verb or move up to the helper. That is a choice, not a rule, and it is where a function model stops.

## What the prototype shows

- The helper verbs behave like typed functions, and the type error explains the usual mistakes.
- Pronoun order, `le → se` and the accent rule can be written as small steps, and a derivation shows each one.
- Person and tense endings (*-é*, *-aste*, *-ó*) do not fit. Each one carries several meanings at once, so they stay as a table, and I would not force them into functions.
- The subjunctive, *ser* and *estar*, and *por* and *para* are choices of meaning, not morphology, so they would be contrast guides like the Japanese particles guide.

## Questions to judge it by

1. Does the type check explain something a textbook doesn't? Here, "ha comer" being wrong is easy to see without it. I think the value is smaller than in Japanese.
2. Do the clitic derivations help? I think this is the strongest part, because the order and accent rules are hard to remember as a list.
3. Is it worth a whole guide, or would these two topics fit better as pages in an existing Spanish grammar?
