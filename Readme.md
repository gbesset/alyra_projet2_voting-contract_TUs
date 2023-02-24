# Projet 2 - Système de Vote

## Sujet
Vous repartirez du smart contract proposé en correction 

Vous devez alors fournir les tests unitaires de votre smart contract Nous n’attendons pas une couverture à 100% du smart contract mais veillez à bien tester les différentes possibilités de retours (event, revert).

  
<br/>

## Mise en place


- CI intégrée sur github pages
- Couverture de code complète, et code coverage récupéré avec Hardat


Au vu de la structure des fonctions (modifier et require) j'ai commencé par verifier toutes les permissions et droits en testant tous les cas qui doivent échouer avant de tester le cas fonctionnel avec verification de l'emission de l'event et des modifications des variables associées

<br>

# Tests effectués
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
- verif fonctionement addVoter (Event et changement effectués)
- un voter ne peut etre ajouté qu'une fois

### Status ProposalsRegistrationStarted
- l'ajout d'une proposition ne peut se faire que dans ce status
- verif fonctionement addProposal (Event et changement effectués)
- une proposition ne peut etre vide
- les propositions commencent a 1, 0 étant GENESIS
  
### Status VotingSessionStarted
- le vote ne peut se faire que dans ce status
- verif fonctionement setVote avec un voteur (Event et changement effectués)
- verif fonctionement setVote avec deux voteurs
- un voter ne peut voter qu'une fois
- Evenement lorsque la proposition n'est pas trouvée
  
### Status  VotingSessionEnded
- l'ajout d'un voter ne peut se faire que dans ce status

### Emission des Evenements
- vérification de l'émission d'évènement à chaque changement d'état

## test fonctionnels
- verification d'un scénario avec plusieurs voters ou l'owner n'est pas voter et verification du gagnant
- scénario similaire avec le owner voter
- scénario avec égalité sur un vote


# Annexe
## tests
![Screenshot execution tests](Documentation/tests_screenshot.png)

## Fees
tableau fees

## Coverage
screen coverage

