# Projet 2 - Système de Vote

## Sujet
Vous repartirez du smart contract proposé en correction 

Vous devez alors fournir les tests unitaires de votre smart contract Nous n’attendons pas une couverture à 100% du smart contract mais veillez à bien tester les différentes possibilités de retours (event, revert).

## Mise en place

couverture je pense et espère comlète

pas été jusqu'à tester les différents permissions en fonctions du workflow status car le modifier est délclenché avant toute chose et donc couvre pour moi tous les cas

dans le satte management constrarint pas de verif des events car 

## Deploiement du contrat
- Verification valeurs par défaut
- vérification owner propriétaire

## Verifications des permissions
 Dans cette partie, seules les restrictions sont testées. Les cas ou cela fonctionne seront traités dans les cas fonctionnels pour moins de code.

### Méthodes protégées par onlyOwner
- un voter non owner ne peut pas  accéder aux méthodes de management de state
- un non voter non owner ne peut pas accéder aux méthodes de management de state
- un voter non owner ne peut ajouter de voter
- un non voter non owner ne peut ajouter de voter
 

### Méthodes protégées par onlyVoters
- un non voter ne peut pas accéder aux méthodes protégées
- un non voter **MAIS owner** ne peut pas non plus accéder aux méthodes protégées

## Test des contraintes de status du workflow
###  status RegisteringVoters
- l'ajout d'un voter ne peut se faire que dans ce status
- un voter ne peut etre ajouté qu'une fois

### Status ProposalsRegistrationStarted
- l'ajout d'une proposition ne peut se faire que dans ce status
- une proposition ne peut etre vide
- les propositions commencent a 1, 0 étant GENESIS
  
### Status VotingSessionStarted
- le vote ne peut se faire que dans ce status
- un voter ne peut voter qu'une fois
- Evenement lorsque la proposition n'est pas trouvée
  
### TODO tayling
- l'ajout d'un voter ne peut se faire que dans ce status

### Emission des Evenements
- vérification de l'émission d'évènement à chaque changement d'état

## test fonctionnels
- verification d'un scénario avec plusieurs voters ou l'owner n'est pas voter et verification du gagnant
- scénario similaire avec le owner voter
- scénario avec égalité sur un vote


# Annexxe
## tests
Screenshot console

## Fees

## Coverage


