<template>
  <div id="app">
    <div class="header">
      <h1>Calculateur d'impôt sur le revenu</h1>
    </div>
    <div class="content">
      <form autocomplete="off">
        <div class="row">
          <div class="w-info">
            <ui-switch
              v-model="useRealCharges"
              label="Frais réels"
              @change="calcTaxesFromGrossIncome()"
            />
            <div class="info">
              <ui-icon icon="info" />
              <ui-tooltip position="right" animation="scale">
                <p>Par défaut, une déduction forfaitaire de 10% est appliquée par revenu
                   et est au minimum égale à 441€ et au maximum à 12627€.
               </p>
                <p>Vous avez la possibilité, à la place de cette déduction automatique,
                   de déduire vos frais réels.
               </p>
              </ui-tooltip>
            </div>
          </div>
          <ui-textbox
            :value="charges"
            name="charges"
            @input="checkInputAndCalc(...arguments, 'charges')"
            placeholder="0"
            label="Frais réels"
            icon-position="right"
            icon="euro"
             v-if="useRealCharges"
          />
        </div>
        <div class="row">
          <ui-textbox
            :value="income"
            name="income"
            @input="checkInputAndCalc(...arguments, 'income')"
            placeholder="0"
            label="Revenus net imposables"
            icon-position="right"
            icon="euro"
          />
          <ui-textbox
            :value="grossIncomeWithoutCharges"
            name="income"
            placeholder="0"
            label="Après déduction"
            icon-position="right"
            icon="euro"
            disabled
            class="opacity"
          />
        </div>
        <div class="row">
          <ui-switch
          v-model="married"
          label="Marié / Pacsé"
          @change="calcTaxesFromGrossIncome(parseInt(income) || 0)"
          />
          <ui-textbox
          :value="children"
          name="children"
          @input="checkInputAndCalc(...arguments, 'children')"
          placeholder="0"
          label="Enfants"
          icon-position="right"
          icon="child_care"
          type="number"
          />
        </div>
        <div class="row">
          <ui-textbox
            class="with-info"
            :value="taxes"
            name="taxes"
            @input="checkInputAndCalc(...arguments, 'taxes')"
            placeholder="0"
            icon-position="right"
            icon="euro"
          >
              <span>Impôts</span>
              <div class="info">
                <ui-icon icon="info" />
                <ui-tooltip position="right" animation="scale">
                  <p>Vous pouvez entrer des impôts dans cette case afin de connaître les revenus
                     net imposables ansi que les revenus nets correspondants.
                  </p>
                  <p>Les plafonds de déduction pour les enfants ne sont pas implémentés pour les calculs
                     effectués à partir de cette case.
                  </p>
                </ui-tooltip>
              </div>
          </ui-textbox>
          <ui-textbox
            v-if="displayTaxesWithoutChildrenMax && halfParts && taxes !== taxesWithoutChildrenMax"
            id="taxes-without-children-max"
            class="with-info"
            :value="taxesWithoutChildrenMax"
            name="taxes-without-children-max"
            @input="checkInputAndCalc(...arguments, 'taxes')"
            placeholder="0"
            label="Sans plafonds"
            icon-position="right"
            icon="euro"
            disabled
          >
              <span>Sans plafonds</span>
              <div class="info">
                <ui-icon icon="info" />
                <ui-tooltip position="right" animation="scale">
                  <p>Les 2 premiers enfants comptent pour une demi-part chacun et les suivants pour
                      2 demi-parts chacun. La réduction d'impôts est plafonnée à 1 567 € par demi-part.
                  </p>
                  <p>À titre purement informatif, le nombre inscrit dans cette case correspond à
                     l'impôt tel qu'il aurait été si ce plafond n'était pas pris en compte.
                  </p>
                </ui-tooltip>
              </div>
          </ui-textbox>
        </div>
        <div class="row">
          <ui-textbox
            class="with-info"
            :value="netIncome"
            name="net"
            @input="checkInputAndCalc(...arguments, 'netIncome')"
            placeholder="0"
            icon-position="right"
            icon="euro"
          >
              <span>Revenus nets</span>
              <div class="info">
                <ui-icon icon="info" />
                <ui-tooltip position="right" animation="scale">
                  <p>Vous pouvez entrer des revenus nets dans cette case afin de connaître les revenus
                     net imposables ansi que les impôts correspondants.
                  </p>
                  <p>Les plafonds de déduction pour les enfants ne sont pas implémentés pour les calculs
                     effectués à partir de cette case.
                  </p>
                </ui-tooltip>
              </div>
          </ui-textbox>
        </div>
      </form>
      <TaxGraphic :brackets="bTaxes" />
    </div>
    <div class="bottom">
        <template v-if="income || income === 0">
            <p>Vous avez <span>{{ taxes | formatEuros }}</span> d'impôts à payer</p>
            <p>Vos revenus nets s'établissent à <span>{{ netIncome | formatEuros }}</span></p>
        </template>
    </div>
  </div>
</template>

<script>
import TaxGraphic from './components/tax-graphic.vue';
/*  CONSTANTES DE L'APPLICATION */
// Plafond des tranches d'imposition
const bMax = [10064, 25659, 73369, 157806, Number.MAX_SAFE_INTEGER];
// Taux des tranches d'imposition
const bRate = [0, 0.11, 0.3, 0.41, 0.45];
// Revenus imposables dans chaque tranche
const bRange = bMax.map((val, i, a) => val - (a[i - 1] || 0));
// Maximum d'impots par tranche pour 1 part
const bRangeTaxes = bRange.map((max, i) => max * bRate[i]);

export default {
  name: 'App',
  components: {
    TaxGraphic,
  },
  data() {
    return {
      income: '',
      useRealCharges: false,
      charges: '',
      children: 0,
      married: false,
      taxes: '',
      taxesWithoutChildrenMax: '',
      displayTaxesWithoutChildrenMax: false,
      netIncome: '',
      bTaxes: [],
    };
  },
  mounted() {
    window.calculator = this;
  },
  methods: {
    reset(value = '') {
      this.income = value;
      this.taxes = value;
      this.taxesWithoutChildrenMax = value;
      this.netIncome = value;
      // Tableau des impôts à payer par tranche
      this.bTaxes = [];
    },

    // Cette fonction est utilisée seulement à des fins de tests internes et n'est pas
    // utilisée par l'application elle-même. Elle regroupe plusieurs configurations et teste
    // plusieurs revenus différents.
    tests() {
      this.children = 0;
      this.married = false;
      this.test(1);
      this.married = true;
      this.test(2);
      this.children = 1;
      this.test(2.5);
      this.children = 3;
      this.test(4);
    },

    test(part) {
      console.log(`----------------   TEST ${part} PART ----------------`);
      console.log(`married ${this.married ? 'true' : 'false'}, children ${this.children}`);
      const incomeFloat = [
        5000 / 0.9,
        25500 / 0.9,
        73300 / 0.9,
        157500 / 0.9,
        257500 / 0.9,
        350000 / 0.9,
        550000 / 0.9,
        850000 / 0.9,
      ];
      const income = incomeFloat.map((x) => Math.round(x));
      const netIncome = [];
      // Calc taxes and net income
      const taxesArr = income.map((x, i) => {
        let grossIncomeWithoutCharges;
        if (this.useRealCharges) {
          grossIncomeWithoutCharges = x - this.charges;
        } else {
          grossIncomeWithoutCharges = x - x * 0.9 > 12627 * this.nbIncome ? x - 12627 * this.nbIncome : x * 0.9;
        }
        const taxes = part > 2 ? this.calcTaxes(grossIncomeWithoutCharges).taxes
          : this.calcTaxesFromGrossIncome(grossIncomeWithoutCharges);

        netIncome[i] = x - taxes;
        return taxes;
      });
      // calc income from taxes
      const incomeFromTaxes = taxesArr.map((i, index) => {
        this.taxes = i;
        this.calcGrossIncomeFromTaxes();
        return Math.abs(income[index] - (this.income || 0)) < 20 ? null : this.income;
      });
      // calc income from net income
      const incomeFromNet = netIncome.map((i, index) => {
        this.netIncome = i;
        this.calcGrossIncomeFromNet();
        return Math.abs(income[index] - (this.income || 0)) < 20 ? null : this.income;
      });

      console.log('income', income);
      console.log('from taxes', incomeFromTaxes);
      console.log('from net', incomeFromNet);
      console.log('-----------------------------------------------');
    },

    checkInputAndCalc(value, fromField) {
      /*
        Vérifier si un nombre a bien été saisi, sinon :
        - si l'entrée est saisie dans l'input des enfants, on met 0 et on recalcule les impôts.
        - sinon on reset tout sauf le nombre d'enfants.
      */
      if (/^[0-9]+$/.test(value)) {
        this[fromField] = parseInt(value, 10);
        switch (fromField) {
          case 'income':
          case 'charges':
          case 'children':
            this.calcTaxesFromGrossIncome();
            break;
          case 'taxes':
            this.calcGrossIncomeFromTaxes();
            break;
          case 'netIncome':
            this.calcGrossIncomeFromNet();
            break;
          default:
        }
      } else {
        // Trick pour forcer le reset les inputs si besoin
        const resetAll = fromField !== 'children' && fromField !== 'charges';
        if (resetAll) {
          this.reset(null);
        } else {
          this[fromField] = null;
        }
        this.$nextTick(() => {
          if (resetAll) {
            this.reset();
          } else {
            this[fromField] = fromField === 'children' ? 0 : '';
            this.calcTaxesFromGrossIncome();
          }
        });
      }
    },

    calcTaxesFromGrossIncome(grossIncome = this.grossIncomeWithoutCharges, parts = this.parts, update = true) {
      if (!grossIncome) {
        return 0;
      }

      this.displayTaxesWithoutChildrenMax = true;
      // Calcul pour 1 part sans mise à jour
      const { taxes: taxesWithoutChildren } = this.calcTaxes(grossIncome, this.nbIncome);
      // Calcul pour toutes les parts
      const taxesForParts = this.calcTaxes(grossIncome, parts);
      let { taxes } = taxesForParts;
      const { taxesPerBracket } = taxesForParts;
      this.taxesWithoutChildrenMax = taxes;

      const maxChildrenDeduction = this.halfParts * 1567;

      taxes = (this.halfParts && (taxesWithoutChildren - taxes > maxChildrenDeduction))
        ? taxesWithoutChildren - maxChildrenDeduction : taxes;

      if (update) {
        this.bTaxes = taxesPerBracket;
        this.taxes = taxes;
        this.netIncome = this.income - taxes;
      }

      return taxes;
    },

    // Calcul des impôts et des revenus net à partir des revenus net imposables
    calcTaxes(grossIncome = this.grossIncomeWithoutCharges, parts = this.parts) {
      const taxableIncome = grossIncome / parts;
      // Recherche de la tranche d'imposition maximum
      const maxBracket = bMax.findIndex((i) => i >= taxableIncome);
      // Calcul des impôts par tranche
      const taxesPerBracket = bMax.slice(0, maxBracket + 1).map((b, i, arr) => Math
        .max(0, (Math.min(taxableIncome, b) - (arr[i - 1] || b))) * bRate[i] * parts);
      // Calcul des impôts en cumulant les impôts payés par tranche
      const taxes = Math.round((taxesPerBracket.length ? taxesPerBracket : [0]).reduce((acc, val) => acc + val));

      return {
        taxesPerBracket,
        taxes,
      };
    },

    // Calcul des revenus net imposables et des impôts à partir des revenus net
    calcGrossIncomeFromNet() {
      if (!this.netIncome) {
        this.reset();
      } else {
        this.displayTaxesWithoutChildrenMax = false;
        let grossIncome = 0;
        let bTaxes = 0;

        if (this.useRealCharges) {
          [grossIncome, bTaxes] = this.calcGrossIncomeFromNetAndCharges(this.charges);
        } else {
          // calcul avec seuil abattement 10% (441)
          [grossIncome, bTaxes] = this.calcGrossIncomeFromNetAndCharges();

          // Si l'abbatement est supérieur au plafond, on utilise le plafond comme base
          // les charges
          if (grossIncome * 0.1 > 12627 * this.nbIncome) {
            [grossIncome, bTaxes] = this.calcGrossIncomeFromNetAndCharges(12627 * this.nbIncome);
          }
        }

        this.income = grossIncome;
        this.bTaxes = bTaxes;
        this.taxes = this.income - this.netIncome;
      }
    },

    calcGrossIncomeFromNetAndCharges(charges = null) {
      let grossIncome;

      // Tableau des maximums nets par tranche
      const bMaxNetIncome = charges === null
        ? bMax.map((m, i) => Math.round(
          ((m / 0.9 - bRangeTaxes.slice(0, i + 1).reduce((a, b) => a + b)) * this.parts),
        ))
        : bMax.map((i) => ((i + charges) - this.calcTaxes(i, 1).taxes) * this.parts);

      // Tranche d'imposition
      const bracket = Math.max(0, bMaxNetIncome.findIndex((i) => i >= this.netIncome));

      if (bracket === 0) {
        return [this.netIncome, [0]];
      }

      // Impôts total des tranches d'imposition précédentes
      const brackets = bRangeTaxes.slice(0, Math.max(0, bracket)).map((t) => t);
      const rate = bRate[bracket];
      // Cumul des impôts totaux des branches précédentes
      const prevTaxes = brackets.reduce((acc, t) => acc + t);
      const prevBracketMax = bMax[bracket - 1];

      /*
          Calcul des revenus net imposables

          Données :

          On appellera tranche d'imposition supérieure la tranche la plus haute utilisée
          pour les calculs du revenu net imposable. Elle correspond à la constante bracket
          calculée ci-dessus. De même, on appelera tranches d'imposition inférieures les
          tranches se situant sous la tranche d'imposition supérieure.

          X = Revenus net imposables
          Y = Revenus net
          c = frais rééls ou abatement automatique de 10%
          p = Parts
          i = Impôts
          t = cumul des impôts des tranches inférieures
          z = Plafond de la tranche supérieure
          r = Taux de la tranche supérieure

          X = Y + pi

          Sachant que les impôts (i) représentent le cumul des impôts issus des tranches
          d'imposition inférieures (t) + les revenus imposables de la tranche d'imposition
          supérieure * taux de cette même tranche soit :

          i = t + ((X - c)/p - z) * r

          et si abattement forfaitaire alors c = 0.1X avec un minimum de 441€ et un maximum de
          12627 :

          i = t + (0.9X/p - z) * r

          On obtient donc pour les frais réels :

          X = Y + pi
          X = Y + pt + Xr - cr - zrp
          X (1 - r) = Y + pt - cr - zrp
          X = (Y + pt - zrp - cr) / (1 - r)
          X = (Y + p(t - zr) - cr) / (1 - r)
          X = (Y + p(t - zr) - cr) / (1 - r)

          Pour l'abattement forfaitaire :

          X = Y + pi
          X = Y + pt + 0.9Xr - zrp
          X - 0.9Xr = Y + pt - zrp
          X (1 - 0.9r) = Y + pt - zrp
          X = (Y + pt - zrp) / (1 - 0.9r)
          X = (Y + p(t - zr)) / (1 - 0.9r)
      */
      if (charges === null) {
        grossIncome = (this.netIncome + this.parts * (prevTaxes
            - prevBracketMax * rate)) / (1 - (0.9 * rate));
      } else {
        grossIncome = (this.netIncome + this.parts * (prevTaxes
              - prevBracketMax * rate) - (charges * rate)) / (1 - rate);

        grossIncome = grossIncome - charges <= bMax[0] ? this.netIncome : grossIncome;
      }

      const bTaxes = [
        ...brackets.map((b) => b * this.parts),
      ];

      bTaxes.push(((grossIncome - this.netIncome) - bTaxes.reduce((acc, val) => acc + val)));

      return [Math.round(grossIncome), bTaxes];
    },
    // Calcul des revenus net imposables et des revenus net à partir des impôts
    calcGrossIncomeFromTaxes() {
      this.displayTaxesWithoutChildrenMax = false;
      if (!this.taxes) {
        this.reset();
      } else {
        // Calcul du maximum d'impots par tranche
        const brackets = bRangeTaxes.map((t) => t * this.parts);
        // Reset du tableau des impôts à payer par tranche
        this.bTaxes = [0];
        // Calcul des revenus net imposables et des revenus net
        brackets.reduce((acc, val, b) => {
          if (acc < this.taxes) {
            if (acc + val >= this.taxes) {
              const prevBMax = bMax[b - 1] || 0;
              const currBTaxe = ((this.taxes - acc) / val) * (bMax[b] - prevBMax);
              this.bTaxes.push(this.taxes - acc);
              if (this.useRealCharges) {
                this.income = Math.round(this.parts * (currBTaxe + prevBMax)) + this.charges;
              } else {
                const grossIncomeWithoutCharges = Math.round((this.bTaxes
                  .reduce((acc2, val2, i) => acc2 + val2 / bRate[i]) + bMax[0] * this.parts));

                if (grossIncomeWithoutCharges / 0.9 - grossIncomeWithoutCharges > 12627 * this.nbIncome) {
                  this.income = grossIncomeWithoutCharges + 12627 * this.nbIncome;
                } else {
                  this.income = Math.round(grossIncomeWithoutCharges / 0.9);
                }

                this.netIncome = this.income - this.taxes;
              }
            } else {
              this.bTaxes.push(val);
            }
          }
          return acc + val;
        });
      }
    },
  },
  computed: {
    parts() {
      return this.nbIncome + (this.children > 2 ? this.children - 1 : this.children * 0.5);
    },
    halfParts() {
      return (this.parts - this.nbIncome) * 2;
    },
    nbIncome() {
      return this.married ? 2 : 1;
    },
    grossIncome() {
      return this.income || 0;
    },
    grossIncomeWithoutCharges() {
      const charges = this.useRealCharges ? Math.max(0, this.charges)
        : Math.max(441 * this.nbIncome, Math.min(12627 * this.nbIncome, Math.round(this.grossIncome * 0.1)));

      return Math.max(0, this.grossIncome - charges);
    },
  },
};
</script>

<style lang="scss">

*{
    box-sizing:
    border-box;
}

body{
  margin: 0;
}

form {
  .ui-textbox.is-active:not(.is-disabled) .ui-textbox__label-text,
  .ui-textbox.is-active:not(.is-disabled) .ui-textbox__icon-wrapper .ui-icon,
  .ui-textbox input:focus,
  .ui-icon {
    color: darkorange;
  }

  .ui-textbox.is-active:not(.is-disabled) .ui-textbox__input {
    border-bottom-color: darkorange;
  }

  .ui-switch--color-primary.is-checked:not(.is-disabled) .ui-switch__thumb,
  .ui-switch--color-primary.is-checked:not(.is-disabled) .ui-switch__track,
  .ui-checkbox--color-primary.is-checked .ui-checkbox__checkmark-background,
  .ui-checkbox--color-primary:not(.is-disabled).is-checked:hover .ui-checkbox__checkmark-background,
  .ui-checkbox--color-primary:not(.is-disabled).is-checked.is-active .ui-checkbox__checkmark-background {
    background-color: darkorange;
  }

  .ui-checkbox--color-primary.is-checked .ui-checkbox__checkmark-background,
  .ui-checkbox--color-primary:not(.is-disabled).is-checked:hover .ui-checkbox__checkmark-background,
  .ui-checkbox--color-primary:not(.is-disabled).is-checked.is-active .ui-checkbox__checkmark-background {
      border-color: darkorange;
  }
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;

  @media screen and (max-width: 800px) {
    padding: 0 15px;
    margin: 15px 0 15px;
  }

  .content{
    display: flex;
    justify-content: center;

    @media screen and (max-width: 800px) {
      flex-direction: column;
      align-items: center;
    }
  }

  .header,
  .tax-details,
  form,
  .bottom{
    border: 1px solid;
  }

  .header, .bottom{
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: #000;
    text-align: center;
    max-width: 975px;
    margin: 15px auto 15px;
    color: #fff;
    border-color: black;
    min-height: 5.5rem;
    padding: 0.75rem;
  }

  .header h1 {
    margin: 0;
  }

  form,
  .tax-details{
    border-color: lightgray;
  }

  form {
    background: #fff;
    padding:  0 2rem;
    max-width: 480px;
    flex: 1 1 auto;
    margin-right: 15px;

    @media screen and (max-width: 800px) {
      max-width: none;
      width: 100%;
      margin: 0;
    }

    .opacity{
      opacity: 0.6;
    }

    .row{
      display: flex;
      margin: 1.5rem 0;
      justify-content: space-between;
      align-items: center;

      .w-info{
        display: flex;
        align-items: center;
        min-width: 180px;
      }

      .info{
        margin-left: 5px;
      }

      div.ui-textbox{
        margin-left: 35px;
        margin-bottom: 0;

        &:first-child{margin-left: 0;}
      }

      @media screen and (max-width: 950px) {
        display: block;

        label.ui-switch,
        div.ui-textbox{
          max-width: 100%;
          margin: 1rem 0;
        }
      }
    }

    .ui-switch,
    .ui-textbox{
      max-width: 180px;
      height: 51px;
    }

    .ui-textbox__label-text,
    .ui-switch__label-text {
      white-space:nowrap;
    }

    .ui-textbox {
      flex: 1;

        input {
            text-align: right;
            border-bottom-width: 1px !important;

            &[type=number]{
               -moz-appearance: textfield;
            }
            &::-webkit-inner-spin-button,
            &::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin:0;
            }
        }

        .ui-textbox__icon-wrapper .ui-icon {
          margin-top: -0.18rem;
          font-size: 1em ;
        }

        &.with-info .ui-textbox__label-text {
            display: flex;

            .ui-icon {
                margin: -0.25rem 0 0 0;
                font-size: 1.5rem;
            }
        }

        &#taxes-without-children-max .ui-textbox__label-text span {
            color: rgba(0, 0, 0, 0.3);
        }
    }

    .ui-checkbox__label-text {
        display: flex;
        align-items: center;

        .ui-icon {
            margin-left: 0.25rem;
        }
    }

    .ui-switch {
        justify-content: flex-start;

        &__label-text{
          color: rgba(0, 0, 0, 0.54);

          &:hover{
            color: rgba(0, 0, 0, 0.7);
          }
        }

        &.is-checked{
          .ui-switch__label-text{color: rgba(0, 0, 0, 0.7)}
        }
    }
  }

  .bottom {
      padding: 0.5rem;

      p {
          margin: 0.25rem;;
          text-align: center;

          span {
              font-weight: bold;
              color: darkorange;
              white-space: nowrap;
          }
      }
  }
}
.ui-tooltip {
  font-size: 1rem;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: justify;
  padding: 0.25rem;

  p {
      margin: 0 0 0.5rem;

      &:last-child {
          margin-bottom: 0;
      }
  }
}
</style>
